from django.contrib.auth import get_user_model
from django.core import mail
from django.core.signing import dumps
from django.test import TestCase, override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.portfolio.models import Achievement

User = get_user_model()


def make_active_user(username='user@test.com', password='testpass123', role='STUDENT', **kwargs):
    email = kwargs.pop('email', username)
    return User.objects.create_user(
        username=username, email=email, password=password, role=role,
        first_name='Test', last_name='User', is_active=True, **kwargs,
    )


def auth_client(user):
    token, _ = Token.objects.get_or_create(user=user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    return client


# ── User.add_xp ───────────────────────────────────────────────────────────────

class UserAddXpTest(TestCase):
    def setUp(self):
        self.user = make_active_user()

    def test_xp_accumulated(self):
        self.user.add_xp(100)
        self.assertEqual(self.user.total_xp, 100)

    def test_level_stays_1_below_threshold(self):
        self.user.add_xp(349)
        self.assertEqual(self.user.level, 1)

    def test_level_2_at_350_xp(self):
        self.user.add_xp(350)
        self.assertEqual(self.user.level, 2)

    def test_level_3_at_700_xp(self):
        self.user.add_xp(700)
        self.assertEqual(self.user.level, 3)

    def test_cumulative_calls_stack(self):
        self.user.add_xp(200)
        self.user.add_xp(200)
        self.assertEqual(self.user.total_xp, 400)
        self.assertEqual(self.user.level, 2)

    def test_zero_xp_level_stays_1(self):
        self.user.add_xp(0)
        self.assertEqual(self.user.level, 1)


# ── Login API ─────────────────────────────────────────────────────────────────

class LoginAPITest(TestCase):
    def setUp(self):
        self.user = make_active_user(username='login@test.com', password='securepass123')
        self.client = APIClient()

    def test_correct_credentials_return_token(self):
        r = self.client.post('/api/login/', {'username': 'login@test.com', 'password': 'securepass123'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertIn('token', r.data)

    def test_response_includes_user_fields(self):
        r = self.client.post('/api/login/', {'username': 'login@test.com', 'password': 'securepass123'}, format='json')
        self.assertEqual(r.data['user']['username'], 'login@test.com')
        self.assertIn('id', r.data['user'])

    def test_wrong_password_returns_401(self):
        r = self.client.post('/api/login/', {'username': 'login@test.com', 'password': 'wrong'}, format='json')
        self.assertEqual(r.status_code, 401)

    def test_missing_password_returns_400(self):
        r = self.client.post('/api/login/', {'username': 'login@test.com'}, format='json')
        self.assertEqual(r.status_code, 400)

    def test_missing_username_returns_400(self):
        r = self.client.post('/api/login/', {'password': 'securepass123'}, format='json')
        self.assertEqual(r.status_code, 400)

    def test_nonexistent_user_returns_401(self):
        r = self.client.post('/api/login/', {'username': 'nobody@test.com', 'password': 'pass'}, format='json')
        self.assertEqual(r.status_code, 401)


# ── Registration API ──────────────────────────────────────────────────────────

@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    CURATOR_REGISTRATION_CODE='TEST-CURATOR-CODE',
)
class RegistrationAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.base_data = {
            'email': 'newuser@test.com',
            'username': 'newuser@test.com',
            'password': 'securepass123',
            'first_name': 'Иван',
            'last_name': 'Иванов',
            'role': 'STUDENT',
        }

    def test_creates_inactive_user(self):
        r = self.client.post('/api/users/', self.base_data, format='json')
        self.assertEqual(r.status_code, 201)
        self.assertFalse(User.objects.get(email='newuser@test.com').is_active)

    def test_sends_verification_email(self):
        self.client.post('/api/users/', self.base_data, format='json')
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('newuser@test.com', mail.outbox[0].recipients())

    def test_employer_without_organization_fails(self):
        data = {**self.base_data, 'email': 'emp@test.com', 'username': 'emp@test.com', 'role': 'EMPLOYER', 'organization': ''}
        r = self.client.post('/api/users/', data, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertIn('organization', r.data)

    def test_employer_with_organization_succeeds(self):
        data = {**self.base_data, 'email': 'emp2@test.com', 'username': 'emp2@test.com', 'role': 'EMPLOYER', 'organization': 'ООО Тест'}
        r = self.client.post('/api/users/', data, format='json')
        self.assertEqual(r.status_code, 201)

    def test_curator_without_code_fails(self):
        data = {**self.base_data, 'email': 'cur@test.com', 'username': 'cur@test.com', 'role': 'CURATOR'}
        r = self.client.post('/api/users/', data, format='json')
        self.assertEqual(r.status_code, 400)

    def test_curator_with_correct_code_succeeds(self):
        data = {
            **self.base_data, 'email': 'cur2@test.com', 'username': 'cur2@test.com', 'role': 'CURATOR',
            'curator_registration_code': 'TEST-CURATOR-CODE',
        }
        r = self.client.post('/api/users/', data, format='json')
        self.assertEqual(r.status_code, 201)

    def test_curator_with_wrong_code_fails(self):
        data = {
            **self.base_data, 'email': 'cur3@test.com', 'username': 'cur3@test.com', 'role': 'CURATOR',
            'curator_registration_code': 'WRONG-CODE',
        }
        r = self.client.post('/api/users/', data, format='json')
        self.assertEqual(r.status_code, 400)

    def test_duplicate_email_fails(self):
        self.client.post('/api/users/', self.base_data, format='json')
        r = self.client.post('/api/users/', self.base_data, format='json')
        self.assertEqual(r.status_code, 400)

    def test_short_password_fails(self):
        data = {**self.base_data, 'email': 'short@test.com', 'username': 'short@test.com', 'password': '123'}
        r = self.client.post('/api/users/', data, format='json')
        self.assertEqual(r.status_code, 400)


# ── Email verification ────────────────────────────────────────────────────────

class EmailVerificationTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='verify@test.com', email='verify@test.com', password='testpass123',
            first_name='Test', last_name='User', is_active=False,
        )
        self.client = APIClient()

    def test_valid_token_activates_user(self):
        token = dumps(self.user.pk, salt='email-confirm')
        r = self.client.get(f'/api/users/verify-email/{token}/')
        self.assertEqual(r.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)

    def test_valid_token_returns_auth_token(self):
        token = dumps(self.user.pk, salt='email-confirm')
        r = self.client.get(f'/api/users/verify-email/{token}/')
        self.assertIn('token', r.data)

    def test_invalid_token_returns_400(self):
        r = self.client.get('/api/users/verify-email/notavalidtoken/')
        self.assertEqual(r.status_code, 400)

    def test_already_active_user_returns_400(self):
        self.user.is_active = True
        self.user.save()
        token = dumps(self.user.pk, salt='email-confirm')
        r = self.client.get(f'/api/users/verify-email/{token}/')
        self.assertEqual(r.status_code, 400)


# ── User stats API ────────────────────────────────────────────────────────────

class UserStatsAPITest(TestCase):
    def setUp(self):
        self.student = make_active_user(username='stats@test.com')
        self.client = auth_client(self.student)
        Achievement.objects.create(
            student=self.student, event_type='OLYMPIAD', level_category='REGIONAL',
            achievement_level='WINNER', title='Олимпиада', status='VERIFIED',
        )
        Achievement.objects.create(
            student=self.student, event_type='HACKATHON', level_category='INTERNAL',
            achievement_level='PARTICIPANT', title='Хакатон', status='VERIFIED',
        )
        Achievement.objects.create(
            student=self.student, event_type='COURSE', level_category='ONLINE_SHORT',
            title='Курс Python', status='PENDING',
        )

    def test_counts_only_verified(self):
        r = self.client.get(f'/api/users/{self.student.pk}/stats/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['total_verified_events'], 2)

    def test_includes_student_name_and_level(self):
        r = self.client.get(f'/api/users/{self.student.pk}/stats/')
        self.assertIn('student_name', r.data)
        self.assertIn('level', r.data)

    def test_breaks_down_by_event_type(self):
        r = self.client.get(f'/api/users/{self.student.pk}/stats/')
        types = {item['event_type'] for item in r.data['stats_by_type']}
        self.assertIn('OLYMPIAD', types)
        self.assertIn('HACKATHON', types)

    def test_anonymous_returns_401(self):
        r = APIClient().get(f'/api/users/{self.student.pk}/stats/')
        self.assertEqual(r.status_code, 401)
