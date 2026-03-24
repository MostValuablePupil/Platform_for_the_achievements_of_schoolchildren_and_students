from django.shortcuts import render
from rest_framework import viewsets
from .models import SkillCategory, Skill, SkillProfile
from .serializers import SkillProfileSerializer, SkillCategorySerializer, SkillSerializer

# Выдаем список профилей (для отрисовки вкладок на фронтенде)
class SkillProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SkillProfile.objects.all()
    serializer_class = SkillProfileSerializer

class SkillCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SkillCategory.objects.all()
    serializer_class = SkillCategorySerializer

class SkillViewSet(viewsets.ReadOnlyModelViewSet):
    # select_related - это оптимизация БД, чтобы Django не делал 100 запросов
    # для получения названий категорий к каждому навыку
    queryset = Skill.objects.select_related('category').all() 
    serializer_class = SkillSerializer

    def get_queryset(self):
        # Оптимизация запросов в базу (чтобы работало быстро)
        queryset = Skill.objects.select_related('category__profile').all()
        
        # Ловим параметр ?profile_id=... из адресной строки
        profile_id = self.request.query_params.get('profile_id')
        if profile_id is not None:
            # Фильтруем навыки: берем только те, чья категория относится к нужному профилю
            queryset = queryset.filter(category__profile__id=profile_id)
            
        return queryset