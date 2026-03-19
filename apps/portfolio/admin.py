from django.contrib import admin
from .models import Achievement, Event

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "date")
    search_fields = ("title", "description")
    list_filter = ("date","skills")
    filter_horizontal = ("skills",)

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ("title", "student", "status", "points", "verifier")
    list_filter = ("status",)
    search_fields = ("title", "student__username")

    
    def save_model(self, request, obj, form, change):
        
        if obj.status == 'VERIFIED' and not obj.verifier:
            obj.verifier = request.user
            
        super().save_model(request, obj, form, change)