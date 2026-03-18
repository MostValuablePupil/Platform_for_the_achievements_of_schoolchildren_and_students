from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    
    class Role(models.TextChoices):
        STUDENT = 'STUDENT', 'Студент'
        CURATOR = 'CURATOR', 'Куратор / Учебное заведение'
        EMPLOYER = 'EMPLOYER', 'Работодатель'
        ADMIN = 'ADMIN', 'Администратор платформы'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
        verbose_name="Роль пользователя"
    )

    middle_name = models.CharField(max_length=150, blank=True, verbose_name="Отчество")
    
    is_deleted = models.BooleanField(default=False, verbose_name="Удален")

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"