from django.contrib import admin

from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject_area', 'year', 'organizer', 'source', 'is_active')
    list_filter = ('source', 'event_type', 'year', 'subject_area', 'is_active')
    search_fields = ('title', 'subject_area', 'organizer')
    ordering = ('-parsed_at',)
