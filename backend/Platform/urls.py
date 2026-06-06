"""
URL configuration for Platform project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# backend/Platform/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf import settings
from django.conf.urls.static import static

# Импортируем наши новые API-вьюшки
from apps.portfolio.views import AchievementViewSet, EventViewSet as PortfolioEventViewSet, search_rsr_diplomas
from apps.events.views import EventViewSet as ParsedEventViewSet
# ✅ УБРАЛИ SubscriptionViewSet отсюда
from apps.users.views import UserViewSet, SpecialtyViewSet, custom_login 
from apps.skills.views import SkillViewSet, SkillCategoryViewSet, SkillProfileViewSet
from apps.telegram_bot.views import GenerateTelegramLinkView, TelegramLinkStatusView, TelegramUnlinkView
from rest_framework.authtoken.views import obtain_auth_token

# Создаем роутер (он сам сгенерирует все нужные ссылки)
router = DefaultRouter()
router.register(r'achievements', AchievementViewSet)
router.register(r'events', PortfolioEventViewSet)
router.register(r'parsed-events', ParsedEventViewSet, basename='parsed-event')
router.register(r'users', UserViewSet, basename='user')
router.register(r'specialties', SpecialtyViewSet)
router.register(r'skill-categories', SkillCategoryViewSet)
router.register(r'skills', SkillViewSet)
router.register(r'profiles', SkillProfileViewSet)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/login/', custom_login, name='api_token_auth'),
    
    # --- МАРШРУТЫ ДЛЯ ДОКУМЕНТАЦИИ ---
    path('api/schema/', SpectacularAPIView.as_view(permission_classes=[IsAuthenticated]), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[IsAuthenticated]), name='swagger-ui'),
    
    # Все запросы, которые начинаются с /dashboard/, 
    # мы отправляем разбираться в приложение users!
    path('api/users/', include('apps.users.urls')),
    
    path('api/rsr-diplomas/', search_rsr_diplomas, name='rsr-diplomas'),

    path('api/telegram/generate-link/', GenerateTelegramLinkView.as_view(), name='telegram-generate-link'),
    path('api/telegram/link-status/', TelegramLinkStatusView.as_view(), name='telegram-link-status'),
    path('api/telegram/unlink/', TelegramUnlinkView.as_view(), name='telegram-unlink'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)