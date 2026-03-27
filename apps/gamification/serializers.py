# apps/gamification/serializers.py
from rest_framework import serializers
from .models import Achievement, AchievementDocument

class AchievementDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AchievementDocument
        fields = ['id', 'file', 'uploaded_at']

class AchievementSerializer(serializers.ModelSerializer):
    documents = AchievementDocumentSerializer(many=True, read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)

    class Meta:
        model = Achievement
        fields = [
            'id', 'student', 'student_name', 'student_email',
            'title', 'type', 'date', 'description',
            'organization', 'link', 'status',
            'created_at', 'verified_at', 'documents'
        ]
        read_only_fields = ['student', 'status', 'created_at', 'verified_at']

class AchievementCreateSerializer(serializers.ModelSerializer):
    documents = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Achievement
        fields = [
            'title', 'type', 'date', 'description',
            'organization', 'link', 'documents'
        ]

    def create(self, validated_data):
        documents_data = validated_data.pop('documents', [])
        request = self.context.get('request')
        
        achievement = Achievement.objects.create(
            student=request.user,
            **validated_data
        )

        # Сохраняем файлы
        for doc in documents_data:
            AchievementDocument.objects.create(
                achievement=achievement,
                file=doc
            )

        return achievement