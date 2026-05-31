import csv
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required # Защита от неавторизованных
from apps.skills.models import UserSkill
from apps.portfolio.models import Achievement
from rest_framework import viewsets
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.core.signing import loads, BadSignature, SignatureExpired
from .serializers import send_verification_email
from drf_spectacular.utils import extend_schema
from rest_framework import serializers as drf_serializers

class LoginRequestSerializer(drf_serializers.Serializer):
    username = drf_serializers.CharField()
    password = drf_serializers.CharField()

@login_required # Декоратор: пускает только тех, кто вошел в аккаунт
def export_my_report(request):
    # Теперь мы берем не случайного студента по ID, а того, кто нажал на кнопку!
    student = request.user

    # Настраиваем HTTP-ответ
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="my_report_{student.username}.csv"'
    response.write(u'\ufeff'.encode('utf8'))

    writer = csv.writer(response, delimiter=';')

    # --- БЛОК 1: Основная информация ---
    writer.writerow(['ОТЧЕТ ПО СТУДЕНТУ'])
    writer.writerow(['ФИО', f"{student.first_name} {student.last_name}"])
    writer.writerow(['Логин', student.username])
    writer.writerow(['Желаемая профессия', student.future_profession or 'Не указана'])
    writer.writerow(['Общий уровень', student.level])
    writer.writerow(['Общий опыт (XP)', student.total_xp])
    writer.writerow([]) # Пустая строка для отступа

    # --- БЛОК 2: Матрица компетенций ---
    writer.writerow(['МАТРИЦА КОМПЕТЕНЦИЙ (НАВЫКИ)'])
    writer.writerow(['Навык', 'Уровень', 'Опыт (XP)']) # Заголовки таблицы
    
    # Достаем навыки, сортируем от самых крутых (минус означает по убыванию)
    skills = UserSkill.objects.filter(user=student).order_by('-level', '-experience')
    for sk in skills:
        writer.writerow([sk.skill.name, sk.level, sk.experience])
    writer.writerow([]) # Пустая строка

    # --- БЛОК 3: Подтвержденные достижения ---
    writer.writerow(['ПОДТВЕРЖДЕННЫЕ ДОСТИЖЕНИЯ'])
    writer.writerow(['Название', 'Баллы', 'Проверил']) # Заголовки
    
    achievements = Achievement.objects.filter(student=student, status='VERIFIED')
    for ach in achievements:
        verifier_name = ach.verifier.username if ach.verifier else "Система"
        writer.writerow([ach.title, ach.points, verifier_name])

    # 4. Отдаем готовый файл
    return response

User = get_user_model()
from rest_framework import viewsets, permissions 
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, SpecialtySerializer
from .models import Specialty
from rest_framework.decorators import action

from rest_framework.response import Response
from django.db.models import Count

User = get_user_model()

class SpecialtyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
    permission_classes = [permissions.AllowAny]

class UserViewSet(viewsets.ModelViewSet): # <--- Замени ReadOnlyModelViewSet на ModelViewSet, чтобы работал POST
    queryset = User.objects.annotate(achievements_count=Count('achievements'))
    serializer_class = UserSerializer
    
    # ВАЖНО: Переопределяем права доступа
    def get_permissions(self):
        if self.action == 'create': # Если действие - создание (регистрация)
            return [permissions.AllowAny()] # Разрешаем всем
        return [permissions.IsAuthenticated()] # Для остального (чтение) нужен токен

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
        # Не раскрываем существует ли аккаунт
        return Response({'detail': 'Если аккаунт с таким email существует и не подтверждён — письмо отправлено.'})

    if not send_verification_email(user):
        return Response({'detail': 'Не удалось отправить письмо. Проверьте email.'}, status=400)

    return Response({'detail': 'Если аккаунт с таким email существует и не подтверждён — письмо отправлено.'})


@extend_schema(request=LoginRequestSerializer)
@api_view(['POST'])
@permission_classes([AllowAny])
def custom_login(request):
    """
    Кастомный логин, который возвращает токен и данные пользователя
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'detail': 'Введите логин и пароль'}, 
            status=400
        )
    
    # Проверяем credentials
    user = authenticate(username=username, password=password)

    if user is None:
        # Проверяем: может пользователь существует, но не подтвердил email
        try:
            inactive_user = User.objects.get(username=username)
            if inactive_user.check_password(password) and not inactive_user.is_active:
                return Response(
                    {'detail': 'Аккаунт не подтверждён. Проверьте почту и перейдите по ссылке из письма.'},
                    status=403
                )
        except User.DoesNotExist:
            pass
        return Response(
            {'detail': 'Неверный логин или пароль'},
            status=401
        )
    
    # Получаем или создаем токен
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
