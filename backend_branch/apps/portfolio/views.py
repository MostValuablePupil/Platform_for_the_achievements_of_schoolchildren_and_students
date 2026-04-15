# backend_branch/apps/portfolio/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
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


class AchievementViewSet(viewsets.ModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        qs = Achievement.objects.all()
        student = self.request.query_params.get('student')
        if student:
            qs = qs.filter(student_id=student)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs
    
    def perform_create(self, serializer):
        achievement = serializer.save(student=self.request.user, status='PENDING')
        self.grant_xp(achievement)
    
    def grant_xp(self, achievement):
        """Начисление XP и обновление уровня"""
        if achievement.status == 'PENDING':
            student = achievement.student
            xp_to_add = achievement.points
            
            student.total_xp += xp_to_add
            student.save(update_fields=['total_xp'])
            
            new_level = (student.total_xp // 350) + 1
            if new_level > student.level:
                student.level = new_level
                student.save(update_fields=['level'])
                
            achievement.is_rewarded = True
            achievement.save(update_fields=['is_rewarded'])

    @action(detail=False, methods=['get'])
    def level_options(self, request):
        """Возвращает список уровней для выбранного типа достижения"""
        event_type = request.query_params.get('event_type')
        if not event_type:
            # Возвращаем все типы
            return Response([
                {'event_type': t[0], 'levels': [], 'has_achievement_level': False}
                for t in Achievement.EventTypeChoices.choices
            ])
        
        # Возвращаем уровни для конкретного типа
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
        if achievement.status != 'PENDING':
            return Response({'detail': 'Уже обработано'}, status=400)
            
        achievement.status = 'VERIFIED'
        achievement.verifier = request.user
        achievement.verified_at = timezone.now()
        achievement.save()
        
        return Response({'detail': 'Подтверждено', 'xp_added': achievement.points})

    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        achievement = self.get_object()
        achievement.status = 'REJECTED'
        achievement.save()
        return Response({'detail': 'Отклонено'})


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
