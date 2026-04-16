# apps/users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Avatar
from apps.portfolio.serializers import UserBadgeSerializer

User = get_user_model()

class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avatar
        fields = ['id', 'name', 'image']

class UserSerializer(serializers.ModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='user-detail', read_only=True)
    avatar_details = AvatarSerializer(source='avatar', read_only=True)
    earned_badges = UserBadgeSerializer(source='badges', many=True, read_only=True)
    
    # 🔥 ДОБАВЬ ЭТО ПОЛЕ (только для записи, не показывается в ответе)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'id', 'url', 'username', 'first_name', 'last_name', 'email',
            'role', 'educational_institution', 'course', 'total_xp', 'level',
            'avatar', 'avatar_details', 'earned_badges', 'password'  # ← добавили password
        ]
        extra_kwargs = {
            'password': {'write_only': True},  # Пароль никогда не возвращается в ответе
        }

    # : хешируем пароль при создании пользователя
    def create(self, validated_data):
        # Извлекаем пароль из данных
        password = validated_data.pop('password')
        # Создаём пользователя с хешированным паролем
        user = User.objects.create_user(**validated_data, password=password)
        return user

    #Также обновляем пароль при редактировании (если нужно)
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)  # Хешируем новый пароль
        return super().update(instance, validated_data)
