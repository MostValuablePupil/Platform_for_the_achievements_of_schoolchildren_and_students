from django.contrib import admin
from .models import SkillCategory, Skill, UserSkill

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

@admin.register(UserSkill)
class UserSkillAdmin(admin.ModelAdmin):
    list_display = ("user", "skill", "level", "experience")
    list_filter = ("skill__category", "level")
    search_fields = ("user__username", "skill__name")   