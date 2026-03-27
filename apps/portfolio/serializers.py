from rest_framework import serializers
from .models import Achievement, Event

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