from django.contrib import admin
from .models import Achievement

# @admin.register(Project)
# class ProjectAdmin(admin.ModelAdmin):
#     list_display = ("title", "date_created")
#     search_fields = ("title", "description")
#     list_filter = ("date_created",)

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ("title", "student", "status", "points", "verifier")
    list_filter = ("status",)
    search_fields = ("title", "student__username")
    

    readonly_fields = ("verifier",)

    
    def save_model(self, request, obj, form, change):
        
        if obj.status == 'VERIFIED' and not obj.verifier:
            obj.verifier = request.user
            
        super().save_model(request, obj, form, change)