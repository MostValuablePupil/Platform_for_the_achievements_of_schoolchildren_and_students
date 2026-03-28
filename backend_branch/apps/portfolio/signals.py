from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Achievement, Badge, UserBadge
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


def award_badge(user, badge_name):
    """Вспомогательная функция: выдает бейдж, если его еще нет"""
    badge = Badge.objects.filter(name=badge_name).first()
    if badge:
        UserBadge.objects.get_or_create(user=user, badge=badge)

@receiver(post_save, sender=Achievement)
def check_and_award_badges(sender, instance, **kwargs):
    # Работаем ТОЛЬКО если статус стал VERIFIED
    if instance.status != 'VERIFIED':
        return

    student = instance.student
    
    # Считаем, сколько одобренных достижений РАЗНОГО ТИПА есть у студента
    # Это один легкий запрос к базе данных!
    stats = {
        'hackathons': Achievement.objects.filter(student=student, event_type='HACKATHON', status='VERIFIED').count(),
        'courses': Achievement.objects.filter(student=student, event_type='COURSE', status='VERIFIED').count(),
        'projects': Achievement.objects.filter(student=student, event_type='TEAM_PROJECT', status='VERIFIED').count(),
        'mentorships': Achievement.objects.filter(student=student, event_type='MENTORSHIP', status='VERIFIED').count(),
        'olympiads': Achievement.objects.filter(student=student, event_type='OLYMPIAD', status='VERIFIED').count(),
    }

    # 1. Инноватор (3 хакатона)
    if stats['hackathons'] >= 3:
        award_badge(student, "Инноватор")

    # 2. Марафонец (10 курсов)
    if stats['courses'] >= 10:
        award_badge(student, "Марафонец")

    # 3. Командный игрок (5 проектов)
    if stats['projects'] >= 5:
        award_badge(student, "Командный игрок")

    # 4. Наставник (Помощь 5 студентам)
    if stats['mentorships'] >= 5:
        award_badge(student, "Наставник")

    # 5. Первая победа (1 олимпиада - упрощенное условие для старта)
    if stats['olympiads'] >= 1:
        award_badge(student, "Первая победа")