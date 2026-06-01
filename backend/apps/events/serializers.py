from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    is_tracked = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'description',
            'event_type',
            'event_type_display',
            'source',
            'source_display',
            'source_url',
            'subject_area',
            'region',
            'grade',
            'year',
            'organizer',
            'event_date',
            'is_active',
            'parsed_at',
            'is_tracked',
        ]

    def get_is_tracked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.trackers.filter(user=request.user).exists()
