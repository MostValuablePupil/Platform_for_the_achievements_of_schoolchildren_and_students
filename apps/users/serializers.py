from rest_framework import serializers
from django.contrib.auth import get_user_model

# Это самый правильный способ получить модель User в Django
User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # ВАЖНО: Перечисляем только те поля, которые МОЖНО отдавать фронтенду.
        # Никаких паролей и is_staff!
        fields = [
            'id', 
            'username', 
            'first_name', 
            'last_name', 
            'email', 
            'role', 
            'educational_institution', 
            'course', 
            'total_xp', 
            'level'
        ]