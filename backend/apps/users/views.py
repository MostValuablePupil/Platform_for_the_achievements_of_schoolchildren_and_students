# backend/apps/users/views.py
import csv
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from apps.skills.models import UserSkill
from apps.portfolio.models import Achievement
from rest_framework import viewsets, permissions, status
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, SpecialtySerializer, SubscribedStudentSerializer
from .models import Specialty, StudentFollow
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Q
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.core.signing import loads, BadSignature, SignatureExpired
from .serializers import send_verification_email
from drf_spectacular.utils import extend_schema
from rest_framework import serializers as drf_serializers

class LoginRequestSerializer(drf_serializers.Serializer):
    username = drf_serializers.CharField()
    password = drf_serializers.CharField()

@login_required
def export_my_report(request):
    student = request.user
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="my_report_{student.username}.csv"'
    response.write(u'\ufeff'.encode('utf8'))

    writer = csv.writer(response, delimiter=';')
    writer.writerow(['ОТЧЕТ ПО СТУДЕНТУ'])
    writer.writerow(['ФИО', f"{student.first_name} {student.last_name}"])
    writer.writerow(['Логин', student.username])
    writer.writerow(['Желаемая профессия', student.future_profession or 'Не указана'])
    writer.writerow(['Общий уровень', student.level])
    writer.writerow(['Общий опыт (XP)', student.total_xp])
    writer.writerow([])

    writer.writerow(['МАТРИЦА КОМПЕТЕНЦИЙ (НАВЫКИ)'])
    writer.writerow(['Навык', 'Уровень', 'Опыт (XP)'])
    skills = UserSkill.objects.filter(user=student).order_by('-level', '-experience')
    for sk in skills:
        writer.writerow([sk.skill.name, sk.level, sk.experience])
    writer.writerow([])

    writer.writerow(['ПОДТВЕРЖДЕННЫЕ ДОСТИЖЕНИЯ'])
    writer.writerow(['Название', 'Баллы', 'Проверил'])
    achievements = Achievement.objects.filter(student=student, status='VERIFIED')
    for ach in achievements:
        verifier_name = ach.verifier.username if ach.verifier else "Система"
        writer.writerow([ach.title, ach.points, verifier_name])

    return response

User = get_user_model()

class SpecialtyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
    permission_classes = [permissions.AllowAny]

class IsUserOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj == request.user


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer

    def get_queryset(self):
        qs = User.objects.annotate(achievements_count=Count('achievements'))
        if self.action == 'list' and not self.request.user.is_staff:
            return qs.filter(pk=self.request.user.pk)
        return qs

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action in ('update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsUserOwner()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        student = self.get_object()
        verified_achievements = student.achievements.filter(status='VERIFIED')
        total_count = verified_achievements.count()
        stats_by_type = verified_achievements.values('event_type').annotate(total=Count('id'))
        recent_events = verified_achievements.order_by('-verified_at').values('title', 'points', 'verified_at')

        return Response({
            "student_name": f"{student.first_name} {student.last_name}",
            "level": student.level,
            "total_verified_events": total_count,
            "stats_by_type": list(stats_by_type),
            "events_list": list(recent_events)
        })

    @action(detail=True, methods=['post'], url_path='follow')
    def follow(self, request, pk=None):
        if request.user.role != 'EMPLOYER':
            return Response({'detail': 'Только работодатели могут отслеживать студентов.'}, status=403)
        
        student = self.get_object()
        if student.role != 'STUDENT':
            return Response({'detail': 'Можно отслеживать только студентов.'}, status=400)
        
        _, created = StudentFollow.objects.get_or_create(employer=request.user, student=student)
        if not created:
            return Response({'detail': 'Вы уже отслеживаете этого студента.'}, status=400)
        
        return Response({'detail': 'Студент добавлен в отслеживаемые.'}, status=201)

    @action(detail=True, methods=['delete'], url_path='unfollow')
    def unfollow(self, request, pk=None):
        if request.user.role != 'EMPLOYER':
            return Response({'detail': 'Только работодатели могут отслеживать студентов.'}, status=403)
        
        student = self.get_object()
        deleted, _ = StudentFollow.objects.filter(employer=request.user, student=student).delete()
        
        if not deleted:
            return Response({'detail': 'Вы не отслеживаете этого студента.'}, status=404)
            
        return Response({'detail': 'Студент удалён из отслеживаемых.'})

    @action(detail=False, methods=['get'], url_path='followed_students')
    def followed_students(self, request):
        if request.user.role != 'EMPLOYER':
            return Response({'detail': 'Только для работодателей.'}, status=403)
        
        student_ids = StudentFollow.objects.filter(employer=request.user).values_list('student_id', flat=True)
        students = User.objects.filter(id__in=student_ids).annotate(achievements_count=Count('achievements'))
        
        # Используем специальный сериализатор с данными о достижениях
        serializer = SubscribedStudentSerializer(students, many=True, context={'request': request})
        return Response(serializer.data)


    @action(detail=True, methods=['get'], url_path='is_followed')
    def is_followed(self, request, pk=None):
        if request.user.role != 'EMPLOYER':
            return Response({'is_followed': False})
        
        student = self.get_object()
        followed = StudentFollow.objects.filter(employer=request.user, student=student).exists()
        return Response({'is_followed': followed})

    @action(detail=False, methods=['get'], url_path='leaderboard')
    def leaderboard(self, request):
        """
        Возвращает список пользователей для лидерборда с фильтрацией и сортировкой.
        Параметры:
        - sort_by: 'xp' или 'achievements'
        - specialty: ID специальности (для студентов)
        - course: номер курса/класса
        - city: город (для школьников)
        - educational_institution: название школы/вуза
        - user_type: 'university' или 'school' (НОВЫЙ ПАРАМЕТР)
        """
        # Базовый queryset: только активные пользователи с ролью STUDENT
        # Мы считаем, что и студенты вузов, и школьники имеют роль STUDENT
        queryset = User.objects.filter(
            role=User.Role.STUDENT, 
            is_active=True, 
            is_deleted=False
        ).annotate(achievements_count=Count('achievements', filter=Q(achievements__status='VERIFIED')))

        # --- НОВАЯ ЛОГИКА: Фильтрация по типу учащегося ---
        user_type = request.query_params.get('user_type')
        
        if user_type == 'university':
            # Студенты вуза: у них ЕСТЬ specialty
            queryset = queryset.filter(specialty__isnull=False)
        elif user_type == 'school':
            # Школьники: у них НЕТ specialty, но есть course (1-11)
            # Исключаем тех, у кого есть specialty, и тех, у кого курс вне диапазона 1-11
            queryset = queryset.filter(
                specialty__isnull=True,
                course__in=['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
            )
        # Если user_type не передан, показываем всех (или можно скрыть по умолчанию)

        # --- ОСТАЛЬНАЯ ФИЛЬТРАЦИЯ ---
        
        specialty_id = request.query_params.get('specialty')
        if specialty_id:
            queryset = queryset.filter(specialty_id=specialty_id)

        course = request.query_params.get('course')
        if course:
            queryset = queryset.filter(course=course)

        city = request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)

        institution = request.query_params.get('educational_institution')
        if institution:
            queryset = queryset.filter(educational_institution__icontains=institution)

        # --- СОРТИРОВКА ---
        sort_by = request.query_params.get('sort_by', 'xp')
        
        if sort_by == 'achievements':
            queryset = queryset.order_by('-achievements_count', '-total_xp')
        else:
            queryset = queryset.order_by('-total_xp', '-achievements_count')

        queryset = queryset[:50]

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request, token):
    try:
        user_pk = loads(token, salt='email-confirm', max_age=86400)
    except SignatureExpired:
        return Response({'detail': 'Ссылка истекла. Зарегистрируйтесь заново.'}, status=400)
    except BadSignature:
        return Response({'detail': 'Неверная ссылка.'}, status=400)

    user = User.objects.filter(pk=user_pk, is_active=False).first()
    if not user:
        return Response({'detail': 'Аккаунт уже активирован или не найден.'}, status=400)

    user.is_active = True
    user.save()

    token_obj, _ = Token.objects.get_or_create(user=user)
    return Response({'detail': 'Email подтверждён. Можете войти.', 'token': token_obj.key})

@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_email(request):
    email = request.data.get('email', '').strip()
    if not email:
        return Response({'detail': 'Укажите email.'}, status=400)
    
    user = User.objects.filter(email=email, is_active=False).first()
    if not user:
        return Response({'detail': 'Если аккаунт с таким email существует и не подтверждён — письмо отправлено.'})

    if not send_verification_email(user):
        return Response({'detail': 'Не удалось отправить письмо. Проверьте email.'}, status=400)

    return Response({'detail': 'Если аккаунт с таким email существует и не подтверждён — письмо отправлено.'})

@extend_schema(request=LoginRequestSerializer)
@api_view(['POST'])
@permission_classes([AllowAny])
def custom_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({'detail': 'Введите логин и пароль'}, status=400)

    user = authenticate(username=username, password=password)

    if user is None:
        try:
            inactive_user = User.objects.get(username=username)
            if inactive_user.check_password(password) and not inactive_user.is_active:
                return Response(
                    {'detail': 'Аккаунт не подтверждён. Проверьте почту и перейдите по ссылке из письма.'},
                    status=403
                )
        except User.DoesNotExist:
            pass
        return Response({'detail': 'Неверный логин или пароль'}, status=401)

    token, created = Token.objects.get_or_create(user=user)

    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
        }
    })