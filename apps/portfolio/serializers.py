from rest_framework import serializers
from .models import Achievement, Event, Badge, UserBadge

# Переводчик для Достижений
class AchievementSerializer(serializers.ModelSerializer):
    proof_file = serializers.FileField(required=False, allow_null=True)
    class Meta:
        model = Achievement
        fields = '__all__'  # Магическая строчка: отдаст вообще ВСЕ поля из БД!

        # НОВАЯ СТРОЧКА: Защищаем эти поля от редактирования через API
        read_only_fields = ['verified_at', 'verifier']

# Переводчик для Мероприятий
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['date']

# 1. Сериализатор для самого бейджа (чтобы отдать картинку и название)
class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'icon']

# 2. Сериализатор для "Полученного бейджа"
class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True) # Вкладываем информацию о бейдже

    class Meta:
        model = UserBadge
        fields = ['badge', 'earned_at']

