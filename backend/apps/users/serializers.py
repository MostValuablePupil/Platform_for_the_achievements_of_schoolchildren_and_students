# apps/users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Avatar
from apps.portfolio.serializers import UserBadgeSerializer
from apps.skills.models import UserSkill # 🔥 1. Новый импорт

User = get_user_model()


class UserSkillSerializer(serializers.ModelSerializer):
    name = serializers.ReadOnlyField(source='skill.name')
    category = serializers.ReadOnlyField(source='skill.category.name')

    class Meta:
        model = UserSkill
        fields = ['id', 'name', 'category', 'experience', 'level']

class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avatar
        fields = ['id', 'name', 'image']

class UserSerializer(serializers.ModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='user-detail', read_only=True)
    avatar_details = AvatarSerializer(source='avatar', read_only=True)
    earned_badges = UserBadgeSerializer(source='badges', many=True, read_only=True)
    
    competencies = UserSkillSerializer(many=True, read_only=True)

    # 🔥 ДОБАВЬ ЭТО ПОЛЕ (только для записи, не показывается в ответе)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'id', 'url', 'username', 'first_name', 'last_name', 'email',
            'role', 'educational_institution', 'course', 'total_xp', 'level',
            'avatar', 'avatar_details', 'earned_badges', 'password', 'competencies',
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
    
class AchievementListSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    points = serializers.IntegerField()
    created = serializers.DateTimeField()
    organization = serializers.CharField(allow_null=True, allow_blank=True)
    event_type = serializers.CharField(source='get_event_type_display') # Красивое название типа

# 🆕 2. Сериализатор для ПРОФИЛЯ СТУДЕНТА (для работодателя)
class StudentProfileSerializer(serializers.ModelSerializer):
    avatar_details = AvatarSerializer(source='avatar', read_only=True)
    # Используем UserSkillSerializer для компетенций
    skills_list = UserSkillSerializer(source='competencies', many=True, read_only=True)
    # Достижения
    verified_achievements = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 
            'educational_institution', 'course', 'future_profession',
            'total_xp', 'level', 
            'avatar_details', 'skills_list', 'verified_achievements'
        ]

    def get_verified_achievements(self, obj):
        # Берем только подтвержденные достижения из связанной модели Achievement
        achievements = obj.achievements.filter(status='VERIFIED').order_by('-created')
        serializer = AchievementListSerializer(achievements, many=True)
        return serializer.data
