from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'STUDENT', 'Студент'
        SCHOOLCHILD = 'SCHOOLCHILD', 'Школьник'
        EMPLOYER = 'EMPLOYER', 'Работодатель'
        TEACHER = 'TEACHER', 'Преподаватель'

    # Базовые поля
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT
    )

    # Поля для студента
    institution = models.CharField(max_length=255, blank=True, verbose_name="Учебное заведение")
    faculty = models.CharField(max_length=255, blank=True, verbose_name="Факультет")
    course = models.CharField(max_length=50, blank=True, verbose_name="Курс")
    
    # Поле для школьника
    grade = models.CharField(max_length=50, blank=True, verbose_name="Класс")
    
    # Дополнительные поля
    future_profession = models.CharField(max_length=255, blank=True, verbose_name="Желаемая профессия")
    total_xp = models.PositiveIntegerField(default=0, verbose_name="Общий опыт")
    level = models.PositiveIntegerField(default=1, verbose_name="Уровень")
    is_deleted = models.BooleanField(default=False, verbose_name="Удалён")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"