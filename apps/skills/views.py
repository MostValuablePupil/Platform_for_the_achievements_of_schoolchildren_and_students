from django.shortcuts import render
from rest_framework import viewsets
from .models import SkillCategory, Skill
from .serializers import SkillCategorySerializer, SkillSerializer

class SkillCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SkillCategory.objects.all()
    serializer_class = SkillCategorySerializer

class SkillViewSet(viewsets.ReadOnlyModelViewSet):
    # select_related - это оптимизация БД, чтобы Django не делал 100 запросов
    # для получения названий категорий к каждому навыку
    queryset = Skill.objects.select_related('category').all() 
    serializer_class = SkillSerializer
