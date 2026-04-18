# backend_branch/apps/portfolio/serializers.py
from rest_framework import serializers
from .models import Achievement, Event, Badge, UserBadge, AchievementFile
from apps.skills.models import Skill


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'

class AchievementFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AchievementFile
        fields = ['id', 'file', 'uploaded_at']

class AchievementSerializer(serializers.ModelSerializer):
    files = AchievementFileSerializer(many=True, read_only=True)
    skill_names = serializers.SerializerMethodField()
    student_name = serializers.ReadOnlyField(source='student.username')
    xp_calculated = serializers.SerializerMethodField()
    event_type_display = serializers.CharField(
        source='get_event_type_display',
        read_only=True
    )
    level_category_display = serializers.SerializerMethodField()
    achievement_level_display = serializers.CharField(
        source='get_achievement_level_display',
        read_only=True
    )
    
    class Meta:
        model = Achievement
        fields = [
            'id', 'title', 'description', 
            'event_type', 'event_type_display',
            'level_category', 'level_category_display',
            'achievement_level', 'achievement_level_display',
            'organization', 'link',
            'status', 'event_date', 'points', 'xp_calculated',
            'student', 'student_name', 'verifier',
            'skills', 'skill_names',
            'hours_count', 'has_certificate',
            'is_rewarded', 'verified_at', 'created', 'files',
        ]
        read_only_fields = ['student', 'verifier', 'is_rewarded', 'verified_at', 'points']

    def get_skill_names(self, obj):
        return [skill.name for skill in obj.skills.all()]
    
    def get_xp_calculated(self, obj):
        return obj.calculate_xp()
    
    def get_level_category_display(self, obj):
        level_mapping = {
            'UNIVERSITY': 'Вузовская',
            'REGIONAL': 'Региональная',
            'ALL_RUSSIA': 'Всероссийская',
            'INTERNAL': 'Внутривузовский',
            'INTER_UNIVERSITY': 'Межвузовский',
            'ONLINE_SHORT': 'Онлайн-курс (до 20 ч)',
            'RETRAINING': 'Профессиональная переподготовка',
            'SHORT': '1-10 часов',
            'LONG': '10+ часов',
            'ARTICLE': 'Статья в сборнике',
            'VAK': 'Публикация в журнале ВАК',
            'EVENT': 'Участие в мероприятии',
        }
        return level_mapping.get(obj.level_category, obj.level_category)

    def create(self, validated_data):
        # Извлекаем skills из validated_data (их нельзя передавать при создании)
        skills_data = validated_data.pop('skills', [])
        
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['student'] = request.user
        
        # Создаём экземпляр для расчёта XP
        temp_obj = Achievement(**validated_data)
        validated_data['points'] = temp_obj.calculate_xp()
        
        # Создаём объект
        achievement = Achievement.objects.create(**validated_data)
        
        # Добавляем skills ПОСЛЕ создания объекта
        if skills_data:
            achievement.skills.set(skills_data)
        
        if request and request.FILES:
            files = request.FILES.getlist('uploaded_files')
            for f in files:
                # Импортируй AchievementFile в начале файла serializers.py
                AchievementFile.objects.create(achievement=achievement, file=f)
        return achievement
    
    def update(self, instance, validated_data):
        skills_data = validated_data.pop('skills', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.points = instance.calculate_xp()
        instance.save()
        
        if skills_data is not None:
            instance.skills.set(skills_data)
        
        return instance


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'icon']


class UserBadgeSerializer(serializers.ModelSerializer):
    badge_name = serializers.ReadOnlyField(source='badge.name')
    
    class Meta:
        model = UserBadge
        fields = ['id', 'badge', 'badge_name', 'earned_at']


class AchievementLevelOptionsSerializer(serializers.Serializer):
    event_type = serializers.CharField()
    
    def to_representation(self, instance):
        event_type = instance.get('event_type')
        
        level_mapping = {
            'OLYMPIAD': 'OLYMPIAD_LEVELS',
            'HACKATHON': 'HACKATHON_LEVELS',
            'COURSE': 'COURSE_LEVELS',
            'VOLUNTEERING': 'VOLUNTEER_LEVELS',
            'SCIENCE': 'SCIENCE_LEVELS',
            'SPORT_ART': 'SPORT_LEVELS',
        }
        
        level_attr = level_mapping.get(event_type)
        
        if level_attr and hasattr(Achievement, level_attr):
            choices_class = getattr(Achievement, level_attr)
            levels = [
                {'value': choice.value, 'label': choice.label}
                for choice in choices_class
            ]
        else:
            levels = []
        
        needs_achievement_level = event_type in ['OLYMPIAD', 'HACKATHON', 'SCIENCE', 'SPORT_ART']
        
        return {
            'event_type': event_type,
            'levels': levels,
            'has_achievement_level': needs_achievement_level,
        }