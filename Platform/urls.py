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
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf import settings
from django.conf.urls.static import static

# Импортируем наши новые API-вьюшки
from apps.portfolio.views import AchievementViewSet, EventViewSet
from apps.users.views import UserViewSet
from apps.skills.views import SkillViewSet, SkillCategoryViewSet, SkillProfileViewSet

# Создаем роутер (он сам сгенерирует все нужные ссылки)
router = DefaultRouter()
router.register(r'achievements', AchievementViewSet)
router.register(r'events', EventViewSet)
router.register(r'users', UserViewSet)
router.register(r'skill-categories', SkillCategoryViewSet)
router.register(r'skills', SkillViewSet)
router.register(r'profiles ', SkillProfileViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    # --- МАРШРУТЫ ДЛЯ ДОКУМЕНТАЦИИ ---
    # 1. Сам файл со схемой API (в формате YAML/JSON, нужен для программ)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # 2. Красивый интерфейс Swagger UI (для людей)
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Все запросы, которые начинаются с /dashboard/, 
    # мы отправляем разбираться в приложение users!
    path('dashboard/', include('apps.users.urls')), 
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)