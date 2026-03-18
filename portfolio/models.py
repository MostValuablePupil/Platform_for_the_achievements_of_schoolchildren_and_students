from django.db import models
from django.conf import settings
from skills.models import Skill  

class Project(models.Model):
    """
    Проекты студента (кейсы, пет-проекты, хакатоны)
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects',
        verbose_name="Студент"
    )
    title = models.CharField(max_length=255, verbose_name="Название проекта")
    description = models.TextField(verbose_name="Описание проекта")
    link = models.URLField(blank=True, verbose_name="Ссылка на репозиторий/демо")
    

    skills = models.ManyToManyField(
        Skill, 
        related_name='projects',
        verbose_name="Используемые навыки"
    )
    
    date_created = models.DateField(auto_now_add=True)

    class Meta:
        verbose_name = "Проект"
        verbose_name_plural = "Проекты"

    def __str__(self):
        return f"{self.title} | {self.student.username}"


class Achievement(models.Model):
    """
    Достижения (сертификаты, грамоты, курсы)
    """
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Черновик'
        PENDING = 'PENDING', 'На проверке'
        VERIFIED = 'VERIFIED', 'Подтверждено'
        REJECTED = 'REJECTED', 'Отклонено'

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
    
    title = models.CharField(max_length=255, verbose_name="Название достижения")
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=10, 
        choices=Status.choices, 
        default=Status.DRAFT,
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
