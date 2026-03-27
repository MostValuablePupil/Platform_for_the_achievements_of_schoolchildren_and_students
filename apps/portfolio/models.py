from django.db import models
from django.conf import settings
from django.utils import timezone

from apps.skills.models import Skill

class Event(models.Model):
    title = models.CharField(max_length=200, verbose_name="Название мероприятия")
    description = models.TextField(verbose_name="Описание")
    date = models.DateTimeField(verbose_name="Дата проведения")
    
    # Ключевое поле для ИИ и поиска! Какие навыки прокачает это мероприятие?
    skills = models.ManyToManyField('skills.Skill', verbose_name="Прокачиваемые навыки")
    
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

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='portfolio_achievements',
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
    
    title = models.CharField(max_length=255, verbose_name="Название достижения")
    description = models.TextField(blank=True, verbose_name="Описание")
    
    proof_link = models.URLField(verbose_name="Ссылка на подтверждение (сертификат/пост)")
    points = models.PositiveIntegerField(default=10, verbose_name="Баллы за достижение")
    
    status = models.CharField(
        max_length=10, 
        choices=Status.choices, 
        default=Status.PENDING, # По умолчанию сразу отправляем на проверку
        verbose_name="Статус верификации"
    )
    
    skills = models.ManyToManyField(
        Skill, 
        related_name='achievements',
        verbose_name="Подтверждаемые навыки"
    )

    class Meta:
        verbose_name = "Достижение"
        verbose_name_plural = "Достижения"

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
