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


class Specialty(models.Model):
    code = models.CharField(max_length=20, unique=True, verbose_name="Код направления", help_text="Например: 09.03.01")
    name = models.CharField(max_length=255, verbose_name="Название направления", help_text="Например: Информатика и вычислительная техника")

    class Meta:
        verbose_name = "Направление подготовки"
        verbose_name_plural = "Направления подготовки"

    def __str__(self):
        return f"{self.code} - {self.name}"


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

    class CourseChoices(models.TextChoices):
        C1 = '1', '1'
        C2 = '2', '2'
        C3 = '3', '3'
        C4 = '4', '4'
        C5 = '5', '5'

    course = models.CharField(
        max_length=50,
        choices=CourseChoices.choices,
        blank=True, 
        null=True, 
        verbose_name="Курс / Класс"
    )

    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Направление подготовки",
        related_name="students"
    )


    is_deleted = models.BooleanField(default=False, verbose_name="Удален")

    total_xp = models.PositiveIntegerField(default=0, verbose_name="Общий опыт (XP)")
    level = models.PositiveIntegerField(default=1, verbose_name="Уровень")

    def add_xp(self, amount):
        """Метод для добавления опыта и расчета уровня"""
        self.total_xp += amount
        # Каждые 350 XP — новый уровень
        self.level = (self.total_xp // 350) + 1
        self.save()

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
