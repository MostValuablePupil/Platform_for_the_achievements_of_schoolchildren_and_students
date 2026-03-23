from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Achievement
from apps.skills.models import UserSkill

@receiver(post_save, sender=Achievement)
def update_student_stats(sender, instance, created, **kwargs):
    """
    Сработает СРАЗУ ПОСЛЕ сохранения достижения.
    """
    # Защита от двойного начисления: проверяем, что статус VERIFIED и опыт ЕЩЕ НЕ выдан
    if instance.status == 'VERIFIED' and not instance.is_rewarded:
        
        # 1. Прокачиваем общий уровень студента
        student = instance.student
        student.add_xp(instance.points) 
        
        # 2. Прокачиваем конкретные компетенции (навыки)
        achievement_skills = instance.skills.all()
        for skill in achievement_skills:
            user_skill, created_skill = UserSkill.objects.get_or_create(
                user=student,
                skill=skill
            )
            user_skill.add_xp(instance.points)
            
        # 3. ВАЖНО: Ставим галочку, что опыт выдан!
        # Используем .update(), потому что он меняет базу напрямую 
        # и НЕ ВЫЗЫВАЕТ метод save() повторно (спасает от бесконечного цикла)
        Achievement.objects.filter(pk=instance.pk).update(is_rewarded=True)