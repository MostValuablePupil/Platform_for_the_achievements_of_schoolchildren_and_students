from django.contrib import admin
from .models import Achievement, Event, Badge, UserBadge

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "date")
    search_fields = ("title", "description")
    list_filter = ("date","skills")
    filter_horizontal = ("skills",)

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ("title", "student", "event_type", "status", "points", "verifier", "verified_at")
    list_filter = ("status", "event_type", "verified_at")
    search_fields = ("title", "student__username")

    
    def save_model(self, request, obj, form, change):
        
        if obj.status == 'VERIFIED' and not obj.verifier:
            obj.verifier = request.user
            
        super().save_model(request, obj, form, change)
        
@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description') # Колонки в общем списке
    search_fields = ('name',)              # Поиск по названию бейджа

@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    # Показываем: Кто получил | Какой бейдж | Когда
    list_display = ('user', 'badge', 'earned_at') 
    
    # Добавляем панель фильтрации сбоку (удобно смотреть всех "Инноваторов")
    list_filter = ('badge', 'earned_at')
    
    # Поиск по логину студента или названию бейджа
    search_fields = ('user__username', 'badge__name')
    
    # Дату получения ставим "только для чтения", чтобы случайно не изменить
    readonly_fields = ('earned_at',)
