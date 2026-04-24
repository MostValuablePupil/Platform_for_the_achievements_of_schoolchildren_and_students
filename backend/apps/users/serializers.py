# apps/users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.conf import settings
from .models import Avatar, Specialty
from apps.portfolio.serializers import UserBadgeSerializer
from apps.skills.models import UserSkill

User = get_user_model()


class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = ['id', 'code', 'name']


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
    specialty_details = SpecialtySerializer(source='specialty', read_only=True)
    earned_badges = UserBadgeSerializer(source='badges', many=True, read_only=True)
    competencies = UserSkillSerializer(many=True, read_only=True)

    password = serializers.CharField(write_only=True, required=True, min_length=8)
    achievements_count = serializers.IntegerField(read_only=True)

    # Поле только для регистрации куратора — не сохраняется в БД
    curator_registration_code = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        help_text="Секретный код, обязательный при регистрации куратора"
    )

    class Meta:
        model = User
        fields = [
            'id', 'url', 'username', 'first_name', 'last_name', 'email',
            'role', 'educational_institution', 'course', 'specialty', 'specialty_details', 'total_xp', 'level',
            'avatar', 'avatar_details', 'earned_badges', 'password', 'competencies', 'future_profession',
            'achievements_count', 'curator_registration_code',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate(self, attrs):
        role = attrs.get('role', User.Role.STUDENT)
        if role == User.Role.CURATOR:
            provided_code = attrs.get('curator_registration_code', '').strip()
            expected_code = getattr(settings, 'CURATOR_REGISTRATION_CODE', '')
            if not provided_code:
                raise serializers.ValidationError(
                    {'curator_registration_code': 'Для регистрации куратора необходимо указать секретный код.'}
                )
            if provided_code != expected_code:
                raise serializers.ValidationError(
                    {'curator_registration_code': 'Неверный секретный код. Регистрация куратора невозможна.'}
                )
        return attrs

    def create(self, validated_data):
        # Убираем код из данных — в БД он не хранится
        validated_data.pop('curator_registration_code', None)
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data, password=password)
        return user

    def update(self, instance, validated_data):
        # При обновлении код куратора игнорируем
        validated_data.pop('curator_registration_code', None)
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)
