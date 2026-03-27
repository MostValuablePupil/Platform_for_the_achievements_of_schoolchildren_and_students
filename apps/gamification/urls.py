# apps/gamification/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AchievementViewSet

router = DefaultRouter()
router.register(r'achievements', AchievementViewSet, basename='achievement')  # ✅ С префиксом!

urlpatterns = [
    path('', include(router.urls)),  # Базовые CRUD: /api/achievements/
    path('achievements/stats/', AchievementViewSet.as_view({'get': 'stats'})),  # ✅ /api/achievements/stats/
    path('achievements/my-skills/', AchievementViewSet.as_view({'get': 'my_skills'})),  # ✅ /api/achievements/my-skills/
]