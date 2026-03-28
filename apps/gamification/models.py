# apps/gamification/models.py
from django.db import models
from django.conf import settings
import os

class Achievement(models.Model):
    class Type(models.TextChoices):
        HACKATHON = 'HACKATHON', 'Хакатоны'     
        OLYMPIAD = 'OLYMPIAD', 'Олимпиады'
        COURSE = 'COURSE', 'Курсы'               
        VOLUNTEER = 'VOLUNTEER', 'Волонтерство'
        PUBLICATION = 'PUBLICATION', 'Публикации' 


    class Status(models.TextChoices):
        PENDING = 'PENDING', 'На проверке'
        VERIFIED = 'VERIFIED', 'Верифицировано'
        REJECTED = 'REJECTED', 'Отклонено'

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='gamification_achievements'
    )
    title = models.CharField(max_length=255, verbose_name="Название")
    type = models.CharField(max_length=20, choices=Type.choices, verbose_name="Тип")
    date = models.DateField(verbose_name="Дата получения")
    description = models.TextField(verbose_name="Описание")
    organization = models.CharField(max_length=255, verbose_name="Организация")
    link = models.URLField(blank=True, null=True, verbose_name="Ссылка")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="Статус"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    verified_at = models.DateTimeField(null=True, blank=True, verbose_name="Дата верификации")

    class Meta:
        verbose_name = 'Достижение'
        verbose_name_plural = 'Достижения'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.student.email})"

class AchievementDocument(models.Model):
    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    file = models.FileField(upload_to='achievements/documents/%Y/%m/%d/', verbose_name="Файл")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата загрузки")

    class Meta:
        verbose_name = 'Документ достижения'
        verbose_name_plural = 'Документы достижений'

    def __str__(self):
        return f"Документ для {self.achievement.title}"

    def file_name(self):
        return os.path.basename(self.file.name)
