from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils.datastructures import MultiValueDict

from apps.portfolio.models import Achievement
from apps.portfolio.serializers import AchievementSerializer


class AchievementSerializerTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="student",
            password="testpass123",
            email="student@example.com",
            first_name="Test",
            last_name="User",
        )

    def test_create_runs_ai_analysis_after_commit(self):
        request = SimpleNamespace(
            user=self.user,
            FILES=MultiValueDict(
                {
                    "uploaded_files": [
                        SimpleUploadedFile("certificate.txt", b"achievement proof", content_type="text/plain")
                    ]
                }
            ),
        )

        serializer = AchievementSerializer(
            data={
                "title": "Хакатон",
                "description": "Командное участие",
                "event_type": Achievement.EventTypeChoices.HACKATHON,
                "level_category": "INTERNAL",
                "achievement_level": Achievement.AchievementLevel.PARTICIPANT,
            },
            context={"request": request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

        queued_ids = []

        def fake_enqueue(achievement_id):
            queued_ids.append(achievement_id)
            return None

        with patch("apps.portfolio.serializers.enqueue_achievement_ai_analysis", side_effect=fake_enqueue):
            with self.captureOnCommitCallbacks(execute=True):
                achievement = serializer.save()

        achievement.refresh_from_db()

        self.assertEqual(queued_ids, [achievement.id])
        self.assertEqual(achievement.ai_analysis_result, "")
        self.assertEqual(achievement.files.count(), 1)
