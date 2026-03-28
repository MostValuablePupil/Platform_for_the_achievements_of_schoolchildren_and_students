from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Avatar
from apps.portfolio.serializers import UserBadgeSerializer

# Это самый правильный способ получить модель User в Django
User = get_user_model()

class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avatar
        fields = ['id', 'name', 'image'] # image автоматически выдаст готовую ссылку!

class UserSerializer(serializers.ModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='user-detail', read_only=True)
    avatar_details = AvatarSerializer(source='avatar', read_only=True)
    earned_badges = UserBadgeSerializer(source='badges', many=True, read_only=True) 

    class Meta:
        model = User
        # ВАЖНО: Перечисляем только те поля, которые МОЖНО отдавать фронтенду.
        # Никаких паролей и is_staff!
        fields = [
            'id',
            'url', 
            'username', 
            'first_name', 
            'last_name', 
            'email', 
            'role', 
            'educational_institution', 
            'course', 
            'total_xp', 
            'level',
            'avatar',
            'avatar_details',
            'earned_badges',
        ]