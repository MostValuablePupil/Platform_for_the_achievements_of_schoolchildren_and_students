from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Achievement, AchievementDocument
from .serializers import AchievementSerializer, AchievementCreateSerializer
from django.db.models import Count, Q

class AchievementViewSet(viewsets.ModelViewSet):
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Achievement.objects.filter(student=self.request.user)
        
        # фильтрация по статусу
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Фильтрация по типу
        type_param = self.request.query_params.get('type')
        if type_param:
            queryset = queryset.filter(type=type_param)
        
        return queryset.select_related('student').prefetch_related('documents')

    def get_serializer_class(self):
        if self.action == 'create':
            return AchievementCreateSerializer
        return AchievementSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Статистика достижений по типам"""
        user = request.user
        
        stats = {
            'total': Achievement.objects.filter(student=user).count(),
            'verified': Achievement.objects.filter(student=user, status='VERIFIED').count(),
            'pending': Achievement.objects.filter(student=user, status='PENDING').count(),
            'by_type': {}
        }

        # Считаем по типам 
        for type_choice in Achievement.Type.choices:
            type_code = type_choice[0]
            count = Achievement.objects.filter(
                student=user,
                type=type_code
            ).count()
            stats['by_type'][type_code] = count

        return Response(stats)

        @action(detail=False, methods=['get'])
        def my_skills(self, request):
            """Навыки из достижений (заглушка)"""
            return Response({
                'results': [],
                'count': 0
            })
