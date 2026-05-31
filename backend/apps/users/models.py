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
    organization = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name="Организация",
        help_text="Название компании работодателя"
    )
    future_profession = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Желаемая профессия",
        help_text="Например: Data Scientist"
    )

    class CourseChoices(models.TextChoices):
        C1 = '1', '1'
        C2 = '2', '2'
        C3 = '3', '3'
        C4 = '4', '4'
        C5 = '5', '5'
        C6 = '6', '6'
        C7 = '7', '7'
        C8 = '8', '8'
        C9 = '9', '9'
        C10 = '10', '10'
        C11 = '11', '11'

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


    city = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name="Город",
        help_text="Город проживания (обязательно для студентов и школьников)"
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
        constraints = [
            models.CheckConstraint(
                check=~models.Q(role='EMPLOYER') | models.Q(organization__gt=''),
                name='employer_must_have_organization',
            )
        ]

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class StudentFollow(models.Model):
    employer = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='following',
        limit_choices_to={'role': 'EMPLOYER'},
        verbose_name="Работодатель"
    )
    student = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='followers',
        limit_choices_to={'role': 'STUDENT'},
        verbose_name="Студент"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата подписки")

    class Meta:
        verbose_name = "Отслеживание студента"
        verbose_name_plural = "Отслеживания студентов"
        unique_together = ('employer', 'student')

    def __str__(self):
        return f"{self.employer} → {self.student}"
