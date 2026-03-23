from django.shortcuts import render
from rest_framework import viewsets
from .models import Achievement, Event
from .serializers import AchievementSerializer, EventSerializer

class AchievementViewSet(viewsets.ModelViewSet):
    queryset = Achievement.objects.all() # Берем все достижения из базы
    serializer_class = AchievementSerializer # Пропускаем через переводчик

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
