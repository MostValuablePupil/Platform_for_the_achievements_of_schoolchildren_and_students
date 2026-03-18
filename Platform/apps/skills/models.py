from django.db import models

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