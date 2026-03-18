from django.contrib import admin
from .models import SkillCategory, Skill

@admin.register(SkillCategory)
class SkillCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    # Теперь в таблице будет видно, к какой категории относится навык
    list_display = ("id", "name", "category") 
    # Справа появится удобный фильтр по категориям!
    list_filter = ("category",)
    # Искать можно будет как по названию навыка, так и по названию категории
    search_fields = ("name", "category__name")