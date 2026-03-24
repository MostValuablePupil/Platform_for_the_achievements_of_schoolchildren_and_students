from rest_framework import serializers
from .models import SkillCategory, Skill, SkillProfile

class SkillProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillProfile
        fields = ['id', 'name']

class SkillCategorySerializer(serializers.ModelSerializer):

    profile_name = serializers.ReadOnlyField(source='profile.name')
    class Meta:
        model = SkillCategory
        fields = ['id', 'name', 'description']

class SkillSerializer(serializers.ModelSerializer):
    # Магия: вытягиваем название категории по связи ForeignKey
    category_name = serializers.ReadOnlyField(source='category.name')
    profile_id = serializers.ReadOnlyField(source='category.profile.id')
    profile_name = serializers.ReadOnlyField(source='category.profile.name')
    class Meta:
        model = Skill
    fields = ['id', 'name', 'category', 'category_name', 'profile_id', 'profile_name', 'description']