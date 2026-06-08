# backend/apps/portfolio/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from .models import Achievement, Event, Badge, UserBadge
from .serializers import (
    AchievementSerializer,
    EventSerializer,
    BadgeSerializer,
    UserBadgeSerializer,
    AchievementLevelOptionsSerializer
)
from django.utils import timezone
import requests
from .rsr_olymp_service import fetch_rsr_diplomas


class IsCuratorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        user_role = getattr(request.user, 'role', None)
        return user_role in ['CURATOR', 'ADMIN'] or request.user.is_staff

class IsOwnerOrCurator(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user_role = getattr(request.user, 'role', None)
        is_curator_admin = user_role in ['CURATOR', 'ADMIN'] or request.user.is_staff
        return obj.student == request.user or is_curator_admin


class AchievementViewSet(viewsets.ModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()] 
        elif self.action in ['update', 'partial_update']:
            return [IsOwnerOrCurator()]
        elif self.action in ['verify', 'reject', 'set_pending']:
            return [permissions.IsAuthenticated(), IsCuratorOrAdmin()]
        elif self.action == 'destroy':
            return [IsOwnerOrCurator()]
        else:
            return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Achievement.objects.all()
        # Если запрос делает студент, он видит только свои достижения
        if getattr(self.request.user, 'role', None) == 'STUDENT':
            qs = qs.filter(student=self.request.user)
        
        # Фильтрация по параметрам запроса (для куратора/админа)
        student = self.request.query_params.get('student')
        if student:
            qs = qs.filter(student_id=student)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
            
        return qs

    def perform_create(self, serializer):
        # Сохраняем достижение, привязывая его к текущему юзеру
        serializer.save(student=self.request.user)

    @action(detail=False, methods=['get'])
    def level_options(self, request):
        """Возвращает список уровней для выбранного типа достижения"""
        event_type = request.query_params.get('event_type')
        if not event_type:
            return Response([
                {'event_type': t[0], 'levels': [], 'has_achievement_level': False}
                for t in Achievement.EventTypeChoices.choices
            ])
        
        level_mapping = {
            'OLYMPIAD': 'OLYMPIAD_LEVELS',
            'HACKATHON': 'HACKATHON_LEVELS',
            'COURSE': 'COURSE_LEVELS',
            'VOLUNTEERING': 'VOLUNTEER_LEVELS',
            'SCIENCE': 'SCIENCE_LEVELS',
            'SPORT_ART': 'SPORT_LEVELS',
        }
        
        level_attr = level_mapping.get(event_type)
        
        if level_attr and hasattr(Achievement, level_attr):
            choices_class = getattr(Achievement, level_attr)
            levels = [
                {'value': choice.value, 'label': choice.label}
                for choice in choices_class
            ]
        else:
            levels = []
        
        needs_achievement_level = event_type in ['OLYMPIAD', 'HACKATHON', 'SCIENCE', 'SPORT_ART']
        
        return Response({
            'event_type': event_type,
            'levels': levels,
            'has_achievement_level': needs_achievement_level,
        })

    @action(detail=True, methods=['patch'])
    def verify(self, request, pk=None):
        """Верификация достижения куратором"""
        achievement = self.get_object()
        
        # Проверка: если уже верифицировано, ничего не делаем
        if achievement.status == 'VERIFIED':
            return Response({'detail': 'Достижение уже подтверждено.'})
            
        # Меняем статус
        achievement.status = 'VERIFIED'
        achievement.verifier = request.user
        
        # ВАЖНО: Мы просто сохраняем объект. 
        # Сигнал post_save (в signals.py) сам перехватит это изменение,
        # проверит флаг is_rewarded и начислит XP один раз.
        achievement.save()
        
        # Получаем обновленные данные студента из БД, чтобы вернуть актуальный баланс во фронтенд
        # Так как save() запустил сигнал, student.total_xp уже обновился в базе
        student = achievement.student
        # Перезагружаем объект студента из БД, чтобы получить свежие значения total_xp и level
        student.refresh_from_db()
        
        return Response({
            'detail': 'Подтверждено', 
            'xp_added': achievement.points,
            'new_total_xp': student.total_xp,
            'new_level': student.level
        })

    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        achievement = self.get_object()
        achievement.status = 'REJECTED'
        achievement.save()
        return Response({'detail': 'Отклонено'})

    @action(detail=True, methods=['patch'], url_path='set-pending')
    def set_pending(self, request, pk=None):
        """Вернуть достижение на проверку"""
        achievement = self.get_object()
        achievement.status = 'PENDING'
        achievement.verifier = None
        achievement.save()
        return Response({'detail': 'Возвращено на проверку'})


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class BadgeViewSet(viewsets.ModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class UserBadgeViewSet(viewsets.ModelViewSet):
    queryset = UserBadge.objects.all()
    serializer_class = UserBadgeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserBadge.objects.filter(user=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_rsr_diplomas(request):
    """Поиск дипломов РСОШ по ФИО и дате рождения."""
    last_name   = request.query_params.get('last_name', '').strip()
    first_name  = request.query_params.get('first_name', '').strip()
    middle_name = request.query_params.get('middle_name', '').strip()
    birth_date  = request.query_params.get('birth_date', '').strip()  # ДД.ММ.ГГГГ

    try:
        year = int(request.query_params.get('year', 2025))
    except ValueError:
        return Response({'error': 'year должен быть числом'}, status=400)

    if not (last_name and first_name and birth_date):
        return Response(
            {'error': 'Укажите last_name, first_name и birth_date (ДД.ММ.ГГГГ)'},
            status=400,
        )

    try:
        day, month, birth_year = map(int, birth_date.split('.'))
    except ValueError:
        return Response({'error': 'birth_date должна быть в формате ДД.ММ.ГГГГ'}, status=400)

    try:
        diplomas = fetch_rsr_diplomas(
            last_name, first_name, middle_name,
            birth_year, month, day, year,
        )
    except requests.Timeout:
        return Response({'error': 'Сервис diploma.rsr-olymp.ru не ответил вовремя. Попробуйте позже.'}, status=502)
    except requests.ConnectionError:
        return Response({'error': 'Не удалось подключиться к diploma.rsr-olymp.ru.'}, status=502)
    except requests.HTTPError as e:
        return Response({'error': str(e)}, status=502)
    except Exception as e:
        return Response({'error': str(e)}, status=502)

    return Response({'diplomas': diplomas, 'year': year, 'count': len(diplomas)})
