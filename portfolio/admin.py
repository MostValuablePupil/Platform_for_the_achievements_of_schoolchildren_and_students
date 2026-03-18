from django.contrib import admin
from .models import Project, Achievement

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    # Что показываем в колонках таблицы
    list_display = ("title", "student", "date_created")
    # По каким полям можно искать текст
    search_fields = ("title", "description", "student__username")
    # Фильтры сбоку
    list_filter = ("date_created",)

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ("title", "student", "status", "verifier")
    list_filter = ("status",)
    search_fields = ("title", "student__username")