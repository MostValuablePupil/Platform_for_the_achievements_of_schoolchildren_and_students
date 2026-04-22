from django.contrib.auth.models import AbstractUser
from django.db import models

class Avatar(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Название аватарки")
    image = models.ImageField(upload_to='avatars/', verbose_name="Изображение аватарки")
    is_selectable = models.BooleanField(default=True, verbose_name="Доступна для выбора")

    class Meta:
        verbose_name = "Аватарка"
        verbose_name_plural = "Аватарки"

    def __str__(self):
        return self.name


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

    avatar = models.ForeignKey(
        Avatar, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Аватарка",
        related_name="users"
    )

    first_name = models.CharField(max_length=150, verbose_name="Имя")
    last_name = models.CharField(max_length=150, verbose_name="Фамилия")
    middle_name = models.CharField(max_length=150, blank=True, verbose_name="Отчество (при наличии)")
    email = models.EmailField(unique=True, verbose_name="Электронная почта")
    educational_institution = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        verbose_name="Учебное заведение",
        help_text="Например: МГТУ им. Баумана или Школа №123"
    )
    course = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        verbose_name="Курс / Класс"
    )
    company = models.CharField(
    max_length=255,
    blank=True,
    null=True,
    verbose_name="Компания",
    help_text="Название компании (для работодателей)"
    )
    
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

