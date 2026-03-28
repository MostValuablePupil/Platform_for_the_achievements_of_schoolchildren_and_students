from rest_framework import serializers
from .models import SkillCategory, Skill, UserSkill

class SkillCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillCategory
        fields = ['id', 'name', 'description']

class SkillSerializer(serializers.ModelSerializer):
    category = SkillCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=SkillCategory.objects.all(),
        source='category',
        write_only=True
    )
    
    class Meta:
        model = Skill
        fields = ['id', 'name', 'description', 'category', 'category_id']

class UserSkillSerializer(serializers.ModelSerializer):
    skill = SkillSerializer(read_only=True)
    skill_id = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(),
        source='skill',
        write_only=True
    )
    
    class Meta:
        model = UserSkill
        fields = ['id', 'skill', 'skill_id', 'experience', 'level']
