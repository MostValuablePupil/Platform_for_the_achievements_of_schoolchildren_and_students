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

    future_profession = models.CharField(
        max_length=255, 
        blank=True, 
        verbose_name="Желаемая профессия",
        help_text="Например: Frontend-разработчик, Дизайнер интерфейсов"
    )

    first_name = models.CharField(max_length=150, verbose_name="Имя")
    last_name = models.CharField(max_length=150, verbose_name="Фамилия")
    middle_name = models.CharField(max_length=150, blank=True, verbose_name="Отчество (при наличии)")
    
    is_deleted = models.BooleanField(default=False, verbose_name="Удален")

    total_xp = models.PositiveIntegerField(default=0, verbose_name="Общий опыт (XP)")
    level = models.PositiveIntegerField(default=1, verbose_name="Уровень")

    def add_xp(self, amount):
        """Метод для добавления опыта и расчета уровня"""
        self.total_xp += amount
        # Простая формула: каждые 100 XP — новый уровень
        self.level = (self.total_xp // 100) + 1
        self.save()

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"