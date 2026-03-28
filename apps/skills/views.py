from rest_framework import viewsets, permissions, generics
from .models import SkillCategory, Skill, UserSkill
from .serializers import SkillCategorySerializer, SkillSerializer, UserSkillSerializer

class SkillCategoryViewSet(viewsets.ModelViewSet):
    queryset = SkillCategory.objects.all()
    serializer_class = SkillCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

class MySkillsView(generics.ListAPIView):
    serializer_class = UserSkillSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserSkill.objects.filter(user=self.request.user).select_related('skill', 'skill__category')
