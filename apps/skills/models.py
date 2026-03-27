from django.db import models
from django.conf import settings

class SkillProfile(models.Model):
    """
    Глобальный профиль (например: 'Технарь', 'Гуманитарий', 'Управленец')
    """
    name = models.CharField(max_length=100, unique=True, verbose_name="Название профиля")
    
    class Meta:
        verbose_name = "Профиль навыков"
        verbose_name_plural = "Профили навыков"

    def __str__(self):
        return self.name

class SkillCategory(models.Model):
    """
    Категория навыков (например: 'Языки программирования', 'Soft Skills', 'Дизайн')
    """
    name = models.CharField(max_length=100, unique=True, verbose_name="Название категории")
    description = models.TextField(blank=True, verbose_name="Описание")

    class Meta:
        verbose_name = "Категория навыка"
        verbose_name_plural = "Категории навыков"
        ordering = ['name'] # Сортировка по алфавиту по умолчанию

    def __str__(self):
        return self.name


class Skill(models.Model):
    """
    Конкретный навык (например: 'Python', 'Публичные выступления', 'Figma')
    """
    category = models.ForeignKey(
        SkillCategory, 
        on_delete=models.CASCADE, 
        related_name='skills',
        verbose_name="Категория"
    )
    name = models.CharField(max_length=100, unique=True, verbose_name="Название навыка")
    description = models.TextField(blank=True, verbose_name="Описание навыка")

    class Meta:
        verbose_name = "Навык"
        verbose_name_plural = "Навыки"
        ordering = ['category__name', 'name'] # Сортируем сначала по категории, потом по имени

    def __str__(self):
        return f"{self.name} ({self.category.name})"
    
class UserSkill(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='competencies', verbose_name="Пользователь")
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, verbose_name="Навык")

    experience = models.PositiveIntegerField(default=0, verbose_name="Опыт (XP)")
    level = models.PositiveIntegerField(default=1, verbose_name="Уровень навыка")
    
    class Meta:
        unique_together = ('user', 'skill') # У одного юзера один прогресс-бар на один навык
        verbose_name = "Компетенция студента"
        verbose_name_plural = "Матрица компетенций"

    def add_xp(self, amount):
        """Метод для автоматического расчета уровня навыка"""
        self.experience += amount
        # Формула: каждые 50 очков опыта дают +1 уровень к навыку
        self.level = (self.experience // 50) + 1
        self.save()

    def __str__(self):
        return f"{self.user.username} - {self.skill.name} (Ур. {self.level})"
