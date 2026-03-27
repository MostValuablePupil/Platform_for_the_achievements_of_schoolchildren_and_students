from django.shortcuts import render
from drf_spectacular.utils import extend_schema 
from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Achievement, Event
from .serializers import AchievementSerializer, EventSerializer


class AchievementViewSet(viewsets.ModelViewSet):
    queryset = Achievement.objects.all() # Берем все достижения из базы
    serializer_class = AchievementSerializer # Пропускаем через переводчик
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
