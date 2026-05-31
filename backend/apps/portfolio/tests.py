from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils.datastructures import MultiValueDict
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.portfolio.models import Achievement
from apps.portfolio.serializers import AchievementSerializer

User = get_user_model()


def make_user(username, role='STUDENT', **kwargs):
    return User.objects.create_user(
        username=username, email=username, password='testpass123',
        first_name='Test', last_name='User', role=role, is_active=True, **kwargs,
    )


def auth_client(user):
    token, _ = Token.objects.get_or_create(user=user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    return client


# ── Existing serializer test ──────────────────────────────────────────────────

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


# ── Achievement.calculate_xp ──────────────────────────────────────────────────

class AchievementCalculateXpTest(TestCase):
    def _ach(self, event_type, level_category, achievement_level='PARTICIPANT',
             has_certificate=False, hours_count=None):
        return Achievement(
            event_type=event_type,
            level_category=level_category,
            achievement_level=achievement_level,
            title='Test',
            has_certificate=has_certificate,
            hours_count=hours_count,
        )

    def test_olympiad_university_participant(self):
        self.assertEqual(self._ach('OLYMPIAD', 'UNIVERSITY', 'PARTICIPANT').calculate_xp(), 50)

    def test_olympiad_regional_prize(self):
        self.assertEqual(self._ach('OLYMPIAD', 'REGIONAL', 'PRIZE').calculate_xp(), 250)

    def test_olympiad_regional_winner(self):
        self.assertEqual(self._ach('OLYMPIAD', 'REGIONAL', 'WINNER').calculate_xp(), 500)

    def test_olympiad_all_russia_winner(self):
        self.assertEqual(self._ach('OLYMPIAD', 'ALL_RUSSIA', 'WINNER').calculate_xp(), 1000)

    def test_hackathon_internal_winner(self):
        self.assertEqual(self._ach('HACKATHON', 'INTERNAL', 'WINNER').calculate_xp(), 400)

    def test_hackathon_inter_university_prize(self):
        self.assertEqual(self._ach('HACKATHON', 'INTER_UNIVERSITY', 'PRIZE').calculate_xp(), 350)

    def test_course_online_no_certificate(self):
        self.assertEqual(self._ach('COURSE', 'ONLINE_SHORT').calculate_xp(), 100)

    def test_course_online_with_certificate(self):
        self.assertEqual(self._ach('COURSE', 'ONLINE_SHORT', has_certificate=True).calculate_xp(), 150)

    def test_course_retraining_with_certificate(self):
        self.assertEqual(self._ach('COURSE', 'RETRAINING', has_certificate=True).calculate_xp(), 400)

    def test_volunteering_short_10_hours(self):
        # 30 XP/h * 10 + 50 bonus = 350
        self.assertEqual(self._ach('VOLUNTEERING', 'SHORT', hours_count=10).calculate_xp(), 350)

    def test_volunteering_long_no_bonus(self):
        # 40 XP/h * 5 + 0 bonus = 200
        self.assertEqual(self._ach('VOLUNTEERING', 'LONG', hours_count=5).calculate_xp(), 200)

    def test_volunteering_null_hours_treated_as_zero(self):
        # hours_count=None → 0 hours; SHORT: 30*0 + 50 = 50
        self.assertEqual(self._ach('VOLUNTEERING', 'SHORT', hours_count=None).calculate_xp(), 50)

    def test_science_vak_winner(self):
        self.assertEqual(self._ach('SCIENCE', 'VAK', 'WINNER').calculate_xp(), 800)

    def test_sport_art_all_russia_prize(self):
        self.assertEqual(self._ach('SPORT_ART', 'ALL_RUSSIA', 'PRIZE').calculate_xp(), 250)

    def test_unknown_event_type_returns_zero(self):
        self.assertEqual(self._ach('UNKNOWN', 'SOME_LEVEL').calculate_xp(), 0)

    def test_known_type_unknown_level_returns_zero(self):
        self.assertEqual(self._ach('OLYMPIAD', 'NONEXISTENT', 'WINNER').calculate_xp(), 0)


# ── Achievement.save auto-calculations ───────────────────────────────────────

class AchievementSaveTest(TestCase):
    def setUp(self):
        self.student = make_user('save_student@test.com')

    def _create(self, status='PENDING', **kwargs):
        defaults = dict(
            student=self.student, event_type='OLYMPIAD', level_category='REGIONAL',
            achievement_level='WINNER', title='Test Achievement', status=status,
        )
        defaults.update(kwargs)
        return Achievement.objects.create(**defaults)

    def test_verified_auto_sets_xp_points(self):
        a = self._create(status='VERIFIED')
        self.assertEqual(a.points, 500)  # OLYMPIAD/REGIONAL/WINNER = 500

    def test_pending_does_not_set_points(self):
        a = self._create(status='PENDING')
        self.assertEqual(a.points, 0)

    def test_verified_sets_verified_at(self):
        a = self._create(status='VERIFIED')
        self.assertIsNotNone(a.verified_at)

    def test_pending_has_no_verified_at(self):
        a = self._create(status='PENDING')
        self.assertIsNone(a.verified_at)

    def test_changing_to_non_verified_clears_verified_at(self):
        a = self._create(status='VERIFIED')
        a.status = 'PENDING'
        a.save()
        self.assertIsNone(a.verified_at)

    def test_rejected_has_no_verified_at(self):
        a = self._create(status='REJECTED')
        self.assertIsNone(a.verified_at)


# ── Achievement API: verify / reject / set_pending ────────────────────────────

class AchievementVerificationAPITest(TestCase):
    def setUp(self):
        self.student = make_user('student@api.test')
        self.curator = make_user('curator@api.test', role='CURATOR')
        self.student_client = auth_client(self.student)
        self.curator_client = auth_client(self.curator)
        self.achievement = Achievement.objects.create(
            student=self.student, event_type='OLYMPIAD', level_category='REGIONAL',
            achievement_level='WINNER', title='Олимпиада', status='PENDING',
        )

    def test_verify_sets_status_verified(self):
        r = self.curator_client.patch(f'/api/achievements/{self.achievement.pk}/verify/')
        self.assertEqual(r.status_code, 200)
        self.achievement.refresh_from_db()
        self.assertEqual(self.achievement.status, 'VERIFIED')

    def test_verify_sets_verifier_to_current_user(self):
        self.curator_client.patch(f'/api/achievements/{self.achievement.pk}/verify/')
        self.achievement.refresh_from_db()
        self.assertEqual(self.achievement.verifier, self.curator)

    def test_verify_response_includes_xp_added(self):
        r = self.curator_client.patch(f'/api/achievements/{self.achievement.pk}/verify/')
        self.assertIn('xp_added', r.data)
        self.assertEqual(r.data['xp_added'], 500)

    def test_reject_sets_status_rejected(self):
        r = self.curator_client.patch(f'/api/achievements/{self.achievement.pk}/reject/')
        self.assertEqual(r.status_code, 200)
        self.achievement.refresh_from_db()
        self.assertEqual(self.achievement.status, 'REJECTED')

    def test_set_pending_clears_verifier(self):
        self.achievement.status = 'VERIFIED'
        self.achievement.verifier = self.curator
        self.achievement.save()
        self.curator_client.patch(f'/api/achievements/{self.achievement.pk}/set-pending/')
        self.achievement.refresh_from_db()
        self.assertEqual(self.achievement.status, 'PENDING')
        self.assertIsNone(self.achievement.verifier)

    def test_anonymous_cannot_verify(self):
        r = APIClient().patch(f'/api/achievements/{self.achievement.pk}/verify/')
        self.assertEqual(r.status_code, 401)

    def test_anonymous_cannot_reject(self):
        r = APIClient().patch(f'/api/achievements/{self.achievement.pk}/reject/')
        self.assertEqual(r.status_code, 401)


# ── Achievement API: filtering ────────────────────────────────────────────────

class AchievementFilterAPITest(TestCase):
    def setUp(self):
        self.student = make_user('flt_student@test.com')
        self.other = make_user('flt_other@test.com')
        self.client = auth_client(self.student)
        self.ach_pending = Achievement.objects.create(
            student=self.student, event_type='COURSE', level_category='ONLINE_SHORT',
            title='Курс', status='PENDING',
        )
        self.ach_verified = Achievement.objects.create(
            student=self.student, event_type='OLYMPIAD', level_category='REGIONAL',
            achievement_level='WINNER', title='Олимпиада', status='VERIFIED',
        )
        self.ach_other = Achievement.objects.create(
            student=self.other, event_type='HACKATHON', level_category='INTERNAL',
            achievement_level='PARTICIPANT', title='Хакатон другого', status='PENDING',
        )

    def test_filter_by_student_excludes_others(self):
        r = self.client.get(f'/api/achievements/?student={self.student.pk}')
        ids = [a['id'] for a in r.data]
        self.assertIn(self.ach_pending.pk, ids)
        self.assertIn(self.ach_verified.pk, ids)
        self.assertNotIn(self.ach_other.pk, ids)

    def test_filter_by_status_pending(self):
        r = self.client.get(f'/api/achievements/?status=PENDING&student={self.student.pk}')
        ids = [a['id'] for a in r.data]
        self.assertIn(self.ach_pending.pk, ids)
        self.assertNotIn(self.ach_verified.pk, ids)

    def test_filter_by_status_verified(self):
        r = self.client.get(f'/api/achievements/?status=VERIFIED&student={self.student.pk}')
        ids = [a['id'] for a in r.data]
        self.assertIn(self.ach_verified.pk, ids)
        self.assertNotIn(self.ach_pending.pk, ids)


# ── Achievement API: level_options ────────────────────────────────────────────

class LevelOptionsAPITest(TestCase):
    def setUp(self):
        self.user = make_user('lvl@test.com')
        self.client = auth_client(self.user)

    def test_olympiad_requires_achievement_level(self):
        r = self.client.get('/api/achievements/level_options/?event_type=OLYMPIAD')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data['has_achievement_level'])

    def test_course_does_not_require_achievement_level(self):
        r = self.client.get('/api/achievements/level_options/?event_type=COURSE')
        self.assertFalse(r.data['has_achievement_level'])

    def test_volunteering_does_not_require_achievement_level(self):
        r = self.client.get('/api/achievements/level_options/?event_type=VOLUNTEERING')
        self.assertFalse(r.data['has_achievement_level'])

    def test_hackathon_requires_achievement_level(self):
        r = self.client.get('/api/achievements/level_options/?event_type=HACKATHON')
        self.assertTrue(r.data['has_achievement_level'])

    def test_no_event_type_returns_all_types(self):
        r = self.client.get('/api/achievements/level_options/')
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.data, list)
        self.assertGreater(len(r.data), 0)
