from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'institution', 'faculty', 
            'course', 'grade', 'future_profession', 
            'total_xp', 'level', 'is_deleted'
        ]
        read_only_fields = ['total_xp', 'level']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name',
            'role', 'institution', 'faculty', 'course', 'grade',
            'future_profession'
        ]
    
    def validate(self, attrs):
        # Проверка совпадения паролей
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Пароли не совпадают"})
        
        # Проверка роли
        role = attrs.get('role')
        if not role:
            raise serializers.ValidationError({"role": "Роль обязательна"})
        
        # Валидация полей для студента
        if role == 'STUDENT':
            if not attrs.get('institution'):
                raise serializers.ValidationError({"institution": "Учебное заведение обязательно для студента"})
            if not attrs.get('course'):
                raise serializers.ValidationError({"course": "Курс обязателен для студента"})
        
        # Валидация полей для школьника
        if role == 'SCHOOLCHILD':
            if not attrs.get('institution'):
                raise serializers.ValidationError({"institution": "Учебное заведение обязательно для школьника"})
            if not attrs.get('grade'):
                raise serializers.ValidationError({"grade": "Класс обязателен для школьника"})
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email_or_username = attrs.get('email')
        password = attrs.get('password')
        
        # Пробуем найти пользователя по email или username
        try:
            if '@' in email_or_username:
                user = User.objects.get(email=email_or_username)
            else:
                user = User.objects.get(username=email_or_username)
        except User.DoesNotExist:
            raise serializers.ValidationError("Пользователь не найден")
        
        if not user.check_password(password):
            raise serializers.ValidationError("Неверный пароль")
        
        if not user.is_active:
            raise serializers.ValidationError("Аккаунт не активен")
        
        attrs['user'] = user
        return attrs