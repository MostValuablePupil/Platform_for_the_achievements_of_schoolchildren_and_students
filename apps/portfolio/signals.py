from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Achievement
from apps.skills.models import UserSkill

@receiver(post_save, sender=Achievement)
def update_student_stats(sender, instance, created, **kwargs):
    """
    Эта функция сработает СРАЗУ ПОСЛЕ сохранения достижения.
    """
    # Нам нужно начислять баллы только если статус "Подтверждено"
    if instance.status == Achievement.Status.VERIFIED:
        
        # 1. Прокачиваем общий уровень студента
        student = instance.student
        student.add_xp(instance.points) # Метод add_xp в модель User
        
        # 2. Прокачиваем конкретные компетенции (навыки)
        achievement_skills = instance.skills.all()
        for skill in achievement_skills:
            user_skill, created_skill = UserSkill.objects.get_or_create(
                user=student,
                skill=skill
            )
            user_skill.add_xp(instance.points)