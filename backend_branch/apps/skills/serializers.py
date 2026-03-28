from rest_framework import serializers
from .models import SkillProfile, SkillCategory, Skill

# 1. Сериализатор для профилей (Технарь, Гуманитарий)
class SkillProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillProfile
        fields = ['id', 'name']

# 2. Сериализатор для категорий
class SkillCategorySerializer(serializers.ModelSerializer):
    profile_name = serializers.ReadOnlyField(source='profile.name')
    
    class Meta:
        model = SkillCategory
        # Обязательно перечисляем все поля, включая кастомное profile_name
        fields = ['id', 'name', 'profile', 'profile_name', 'description']

# 3. Сериализатор для самих навыков (тот, на который ругался сервер)
class SkillSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    profile_id = serializers.ReadOnlyField(source='category.profile.id')
    profile_name = serializers.ReadOnlyField(source='category.profile.name')

    class Meta:
        model = Skill
        # ВАЖНО: Мы перечисляем всё, что хотим видеть в JSON
        fields = [
            'id', 
            'name', 
            'category', 
            'category_name', 
            'profile_id', 
            'profile_name', 
            'description'
        ]