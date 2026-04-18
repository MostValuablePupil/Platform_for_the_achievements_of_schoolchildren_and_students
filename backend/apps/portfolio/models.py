# backend_branch/apps/portfolio/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.skills.models import Skill


class Event(models.Model):
    title = models.CharField(max_length=200, verbose_name="Название мероприятия")
    description = models.TextField(verbose_name="Описание")
    date = models.DateTimeField(verbose_name="Дата проведения")
    created = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    
    # Связь с навыками через промежуточную таблицу (если нужна) или прямая M2M
    skills = models.ManyToManyField(
        'skills.Skill', 
        verbose_name="Прокачиваемые навыки",
        blank=True
    )
    
    class Meta:
        verbose_name = "Мероприятие"
        verbose_name_plural = "Мероприятия"

    def __str__(self):
        return self.title


class Achievement(models.Model):
    """
    Достижения (заявки на верификацию)
    """
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Черновик'
        PENDING = 'PENDING', 'На проверке'
        VERIFIED = 'VERIFIED', 'Подтверждено'
        REJECTED = 'REJECTED', 'Отклонено'

    # ===== ТИПЫ ДОСТИЖЕНИЙ =====
    class EventTypeChoices(models.TextChoices):
        OLYMPIAD = 'OLYMPIAD', '🧠 Олимпиада'
        HACKATHON = 'HACKATHON', '💻 Проект / Хакатон'
        COURSE = 'COURSE', '📚 Курс / Обучение'
        VOLUNTEERING = 'VOLUNTEERING', '🤝 Волонтерство'
        SCIENCE = 'SCIENCE', '🔬 Научная работа'
        SPORT_ART = 'SPORT_ART', '🏅 Спорт / Творчество'

    # ===== РЕЗУЛЬТАТЫ =====
    class AchievementLevel(models.TextChoices):
        PARTICIPANT = 'PARTICIPANT', 'Участие'
        PRIZE = 'PRIZE', 'Призёр'
        WINNER = 'WINNER', 'Победитель'

    # ===== ПОЛЯ МОДЕЛИ =====
    
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='achievements',
        verbose_name="Студент"
    )
    
    verifier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_achievements',
        verbose_name="Проверяющий (Куратор)"
    )

    event_type = models.CharField(
        max_length=20,
        choices=EventTypeChoices.choices,
        verbose_name="Тип достижения"
    )

    level_category = models.CharField(
        max_length=30,
        verbose_name="Уровень/Категория",
        help_text="Например: UNIVERSITY, REGIONAL, INTERNAL..."
    )
    
    achievement_level = models.CharField(
        max_length=20,
        choices=AchievementLevel.choices,
        default='PARTICIPANT',
        verbose_name="Результат",
        blank=True
    )
    
    title = models.CharField(
        max_length=255, 
        verbose_name="Название достижения"
    )
    
    description = models.TextField(
        blank=True, 
        verbose_name="Описание"
    )
    
    organization = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Организация/Учреждение"
    )
    
    link = models.URLField(
        blank=True,
        verbose_name="Ссылка"
    )
    
    
    hours_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Количество часов",
        help_text="Для волонтёрства"
    )
    
    has_certificate = models.BooleanField(
        default=False,
        verbose_name="Есть сертификат/диплом",
        help_text="Для курсов"
    )
    
    # Навыки
    skills = models.ManyToManyField(
        Skill, 
        related_name='achievements',
        verbose_name="Подтверждаемые навыки",
        blank=True
    )
    
    points = models.PositiveIntegerField(
        default=0, 
        verbose_name="Баллы за достижение (XP)"
    )
    
    status = models.CharField(
        max_length=10, 
        choices=Status.choices, 
        default=Status.PENDING,
        verbose_name="Статус верификации"
    )
    
    is_rewarded = models.BooleanField(
        default=False, 
        verbose_name="Опыт начислен"
    )
    
    verified_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Дата и время подтверждения"
    )
    
    event_date = models.DateField(
        null=True, blank=True, verbose_name="Дата мероприятия"
    )

    created = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )

    # ===== МЕТОД РАСЧЕТА XP =====
    def calculate_xp(self):
        xp_table = {
            'OLYMPIAD': {
                'UNIVERSITY': {'PARTICIPANT': 50, 'PRIZE': 150, 'WINNER': 300},
                'REGIONAL': {'PARTICIPANT': 100, 'PRIZE': 250, 'WINNER': 500},
                'ALL_RUSSIA': {'PARTICIPANT': 200, 'PRIZE': 500, 'WINNER': 1000},
            },
            'HACKATHON': {
                'INTERNAL': {'PARTICIPANT': 80, 'PRIZE': 200, 'WINNER': 400},
                'INTER_UNIVERSITY': {'PARTICIPANT': 150, 'PRIZE': 350, 'WINNER': 700},
            },
            'COURSE': {
                'ONLINE_SHORT': {'BASE': 100, 'CERTIFICATE_BONUS': 50},
                'RETRAINING': {'BASE': 300, 'CERTIFICATE_BONUS': 100},
            },
            'VOLUNTEERING': {
                'SHORT': {'XP_PER_HOUR': 30, 'BONUS': 50},
                'LONG': {'XP_PER_HOUR': 40, 'BONUS': 0},
            },
            'SCIENCE': {
                'ARTICLE': {'PARTICIPANT': 150, 'WINNER': 300},
                'VAK': {'PARTICIPANT': 400, 'WINNER': 800},
            },
            'SPORT_ART': {
                'UNIVERSITY': {'PARTICIPANT': 40, 'PRIZE': 100, 'WINNER': 250},
                'REGIONAL': {'PARTICIPANT': 60, 'PRIZE': 150, 'WINNER': 350},
                'ALL_RUSSIA': {'PARTICIPANT': 100, 'PRIZE': 250, 'WINNER': 500},
            },
        }
        
        table = xp_table.get(self.event_type, {})
        level_data = table.get(self.level_category, {})
        
        if self.event_type == 'COURSE':
            base = level_data.get('BASE', 0)
            if self.has_certificate:
                base += level_data.get('CERTIFICATE_BONUS', 0)
            return base
        
        if self.event_type == 'VOLUNTEERING':
            xp_per_hour = level_data.get('XP_PER_HOUR', 0)
            hours = self.hours_count or 0
            xp = xp_per_hour * hours
            xp += level_data.get('BONUS', 0)
            return xp
        
        return level_data.get(self.achievement_level, 0)

    def save(self, *args, **kwargs):
        # Авто-расчет XP перед сохранением
        if self.status == 'VERIFIED':
             self.points = self.calculate_xp()
        
        # Дата верификации
        if self.status == 'VERIFIED' and not self.verified_at:
            self.verified_at = timezone.now()
        elif self.status != 'VERIFIED' and self.verified_at:
            self.verified_at = None
            
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Достижение"
        verbose_name_plural = "Достижения"
        ordering = ['-created']

    def __str__(self):
        return f"{self.title} ({self.get_event_type_display()})"



class AchievementFile(models.Model):
    achievement = models.ForeignKey(
        'Achievement', 
        related_name='files', 
        on_delete=models.CASCADE
    )
    file = models.FileField(upload_to='achievements/proofs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"File for {self.achievement.title}"


class Badge(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Название бейджа")
    description = models.TextField(verbose_name="Описание (за что дается)")
    icon = models.ImageField(upload_to='badges/', verbose_name="Иконка бейджа")

    class Meta:
        verbose_name = "Бейдж"
        verbose_name_plural = "Бейджи"

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='badges',
        verbose_name="Студент"
    )
    badge = models.ForeignKey(
        Badge, 
        on_delete=models.CASCADE, 
        verbose_name="Бейдж"
    )
    earned_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата получения")

    class Meta:
        verbose_name = "Бейдж пользователя"
        verbose_name_plural = "Бейджи пользователей"
        unique_together = ('user', 'badge')

    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"
