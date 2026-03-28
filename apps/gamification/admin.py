from django.contrib import admin
from .models import Achievement, AchievementDocument
# Register your models here.
@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('title', 'type','status','organization','created_at','verified_at')
    search_fields = ("title", "description",)
    list_filter = ("status",)
# admin.site.register(Achievement)
@admin.register(AchievementDocument)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('uploaded_at', 'file', 'achievement')
    search_fields = ("achievement",)
    list_filter = ("uploaded_at",)

# admin.site.register(AchievementDocument)