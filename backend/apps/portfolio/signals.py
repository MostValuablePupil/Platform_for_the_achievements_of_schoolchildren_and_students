from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Achievement, Badge, UserBadge
from apps.skills.models import UserSkill

@receiver(post_save, sender=Achievement)
def update_student_stats(sender, instance, created, **kwargs):
    if instance.status == 'VERIFIED' and not instance.is_rewarded:
        student = instance.student
        student.add_xp(instance.points) 
        
        # achievement_skills = instance.skills.all()
        # for skill in achievement_skills:
        #     user_skill, _ = UserSkill.objects.get_or_create(user=student, skill=skill)
        #     user_skill.add_xp(instance.points)
            
        Achievement.objects.filter(pk=instance.pk).update(is_rewarded=True)

def award_badge(user, badge_name):
    badge = Badge.objects.filter(name=badge_name).first()
    if badge:
        UserBadge.objects.get_or_create(user=user, badge=badge)

@receiver(post_save, sender=Achievement)
def check_and_award_badges(sender, instance, **kwargs):
    if instance.status != 'VERIFIED':
        return

    student = instance.student
    
    # Достаем ВСЕ верифицированные достижения студента
    achievements = Achievement.objects.filter(student=student, status='VERIFIED')
    
    # ================= 1. ОЛИМПИАДЫ =================
    olympiads = achievements.filter(event_type='OLYMPIAD')
    if olympiads.filter(achievement_level='WINNER').exists(): award_badge(student, "Первая победа")
    if olympiads.filter(achievement_level='PRIZE').exists(): award_badge(student, "Призёр")
    if olympiads.filter(achievement_level='PARTICIPANT').exists(): award_badge(student, "Участник")
    if olympiads.count() >= 5: award_badge(student, "Олимпиадный боец")
    if olympiads.filter(level_category='UNIVERSITY', achievement_level='WINNER').exists(): award_badge(student, "Лидер вуза")
    if olympiads.filter(level_category='REGIONAL', achievement_level='WINNER').exists(): award_badge(student, "Региональный эксперт")
    if olympiads.filter(level_category='ALL_RUSSIA', achievement_level='WINNER').exists(): award_badge(student, "Всероссийский чемпион")

    # ================= 2. ХАКАТОНЫ И ПРОЕКТЫ =================
    hackathons = achievements.filter(event_type='HACKATHON')
    if hackathons.exists(): award_badge(student, "Проектировщик") # Выдаем за 1 хакатон
    if hackathons.count() >= 3: award_badge(student, "Инноватор")
    if hackathons.count() >= 5: award_badge(student, "Командный игрок")
    if hackathons.filter(level_category='INTER_UNIVERSITY', achievement_level='WINNER').exists(): award_badge(student, "Технолидер")

    # ================= 3. КУРСЫ =================
    courses = achievements.filter(event_type='COURSE')
    if courses.count() >= 10: award_badge(student, "Марафонец")
    if courses.filter(has_certificate=True).exists(): award_badge(student, "Сертифицирован")

    # ================= 4. ВОЛОНТЕРСТВО =================
    volunteering = achievements.filter(event_type='VOLUNTEERING')
    if volunteering.exists(): award_badge(student, "Помощник")
    if volunteering.count() >= 3: award_badge(student, "Социальный лидер")

    # ================= 5. НАУКА (БЕЗ ДОКЛАДЧИКА) =================
    science = achievements.filter(event_type='SCIENCE')
    if science.filter(level_category='ARTICLE').exists(): award_badge(student, "Исследователь")
    if science.filter(level_category='VAK').exists(): award_badge(student, "Научный автор")

    # ================= 6. СПОРТ И ТВОРЧЕСТВО =================
    sport_art = achievements.filter(event_type='SPORT_ART')
    if sport_art.filter(achievement_level='PARTICIPANT').exists(): award_badge(student, "Участник (Спорт/Творчество)")
    if sport_art.filter(achievement_level='PRIZE').exists(): award_badge(student, "Талант")
    if sport_art.filter(achievement_level='WINNER').exists(): award_badge(student, "Чемпион")
    if sport_art.count() >= 5: award_badge(student, "Разносторонний")