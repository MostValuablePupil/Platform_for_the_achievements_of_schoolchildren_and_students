from django.contrib import admin

from .models import TelegramProfile


@admin.register(TelegramProfile)
class TelegramProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "chat_id", "username", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("user__username", "user__email", "username", "chat_id")
    autocomplete_fields = ("user",)

# Register your models here.
