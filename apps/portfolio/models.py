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

    class EventTypeChoices(models.TextChoices):
        VOLUNTEERING = 'VOLUNTEERING', 'Волонтерство'
        HACKATHON = 'HACKATHON', 'Хакатон'
        COURSE = 'COURSE', 'Пройденный курс'
        OLYMPIAD = 'OLYMPIAD', 'Олимпиада'
        PUBLICATION = 'PUBLICATION', 'Научная публикация'
        OTHER = 'OTHER', 'Другое' 

    # Новое поле для выбора типа
    event_type = models.CharField(
        max_length=20,
        choices=EventTypeChoices.choices,
        default=EventTypeChoices.HACKATHON,
        verbose_name="Тип мероприятия"
    )

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
    
    # ... твои поля статуса и т.д.
    is_rewarded = models.BooleanField(
        default=False, 
        verbose_name="Опыт начислен"
    )
    title = models.CharField(max_length=255, verbose_name="Название достижения")
    description = models.TextField(blank=True, verbose_name="Описание")
    
    proof_file = models.FileField(
        upload_to='proofs/%Y/%m/', 
        blank=True, 
        null=True, 
        verbose_name="Файл подтверждения"
    )    
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

    # Время подтверждения (может быть пустым, пока не подтвердят)
    verified_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Дата и время подтверждения"
    )

    # МАГИЯ DJANGO: Перехватываем момент сохранения в базу
    def save(self, *args, **kwargs):
        # Если статус стал VERIFIED, а даты еще нет — ставим текущее время
        if self.status == 'VERIFIED' and not self.verified_at:
            self.verified_at = timezone.now()
        
        # Защита от ошибок: если куратор передумал и вернул статус на PENDING (На проверке),
        # мы стираем дату подтверждения, чтобы всё было честно.
        elif self.status != 'VERIFIED' and self.verified_at:
            self.verified_at = None
            
        # Вызываем стандартное сохранение
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Достижение"
        verbose_name_plural = "Достижения"

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"