from rest_framework import serializers
from .models import SkillCategory, Skill, UserSkill

class SkillCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillCategory
        fields = ['id', 'name', 'description']

class SkillSerializer(serializers.ModelSerializer):
    # Магия: вытягиваем название категории по связи ForeignKey
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'category_name', 'description']