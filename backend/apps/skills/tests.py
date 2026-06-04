from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.skills.models import Skill, SkillCategory, SkillProfile, UserSkill

User = get_user_model()


def make_user(username='skill_user@test.com'):
    return User.objects.create_user(
        username=username, email=username, password='testpass123',
        first_name='Test', last_name='User', is_active=True,
    )


def auth_client(user):
    token, _ = Token.objects.get_or_create(user=user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    return client


def make_skill(name, category_name='Программирование', profile_name='Технарь'):
    profile, _ = SkillProfile.objects.get_or_create(name=profile_name)
    category, _ = SkillCategory.objects.get_or_create(name=category_name, defaults={'profile': profile})
    return Skill.objects.create(name=name, category=category)


# ── UserSkill.add_xp ──────────────────────────────────────────────────────────

class UserSkillAddXpTest(TestCase):
    def setUp(self):
        self.user = make_user()
        skill = make_skill('Python')
        self.user_skill = UserSkill.objects.create(user=self.user, skill=skill)

    def test_xp_accumulated(self):
        self.user_skill.add_xp(30)
        self.assertEqual(self.user_skill.experience, 30)

    def test_level_starts_at_1(self):
        self.assertEqual(self.user_skill.level, 1)

    def test_level_stays_1_below_50_xp(self):
        self.user_skill.add_xp(49)
        self.assertEqual(self.user_skill.level, 1)

    def test_level_2_at_50_xp(self):
        self.user_skill.add_xp(50)
        self.assertEqual(self.user_skill.level, 2)

    def test_level_3_at_100_xp(self):
        self.user_skill.add_xp(100)
        self.assertEqual(self.user_skill.level, 3)

    def test_cumulative_calls_stack(self):
        self.user_skill.add_xp(30)
        self.user_skill.add_xp(30)
        self.assertEqual(self.user_skill.experience, 60)
        self.assertEqual(self.user_skill.level, 2)

    def test_zero_xp_level_stays_1(self):
        self.user_skill.add_xp(0)
        self.assertEqual(self.user_skill.level, 1)


# ── UserSkill uniqueness ──────────────────────────────────────────────────────

class UserSkillUniquenessTest(TestCase):
    def setUp(self):
        self.user = make_user('unique_skill_user@test.com')
        self.skill = make_skill('JavaScript')

    def test_duplicate_user_skill_raises_error(self):
        from django.db import IntegrityError
        UserSkill.objects.create(user=self.user, skill=self.skill)
        with self.assertRaises(IntegrityError):
            UserSkill.objects.create(user=self.user, skill=self.skill)


# ── Skills API ────────────────────────────────────────────────────────────────

class SkillsAPITest(TestCase):
    def setUp(self):
        self.user = make_user('skills_api@test.com')
        self.client = auth_client(self.user)

        self.profile_tech = SkillProfile.objects.create(name='Технарь')
        self.profile_human = SkillProfile.objects.create(name='Гуманитарий')
        self.cat_prog = SkillCategory.objects.create(name='Программирование', profile=self.profile_tech)
        self.cat_lang = SkillCategory.objects.create(name='Языки', profile=self.profile_human)
        self.skill_python = Skill.objects.create(name='Python', category=self.cat_prog)
        self.skill_english = Skill.objects.create(name='English', category=self.cat_lang)

    def test_list_returns_all_skills(self):
        r = self.client.get('/api/skills/')
        self.assertEqual(r.status_code, 200)
        names = [s['name'] for s in r.data]
        self.assertIn('Python', names)
        self.assertIn('English', names)

    def test_filter_by_profile_id(self):
        r = self.client.get(f'/api/skills/?profile_id={self.profile_tech.pk}')
        self.assertEqual(r.status_code, 200)
        names = [s['name'] for s in r.data]
        self.assertIn('Python', names)
        self.assertNotIn('English', names)

    def test_anonymous_requires_auth(self):
        r = APIClient().get('/api/skills/')
        self.assertEqual(r.status_code, 401)

    def test_skill_includes_category_name(self):
        r = self.client.get('/api/skills/')
        python_data = next(s for s in r.data if s['name'] == 'Python')
        self.assertEqual(python_data['category_name'], 'Программирование')


# ── SkillCategories API ───────────────────────────────────────────────────────

class SkillCategoriesAPITest(TestCase):
    def setUp(self):
        self.user = make_user('cat_api@test.com')
        self.client = auth_client(self.user)
        profile = SkillProfile.objects.create(name='Тест профиль')
        SkillCategory.objects.create(name='Аналитика', profile=profile)
        SkillCategory.objects.create(name='Дизайн', profile=profile)

    def test_list_returns_all_categories(self):
        r = self.client.get('/api/skill-categories/')
        self.assertEqual(r.status_code, 200)
        names = [c['name'] for c in r.data]
        self.assertIn('Аналитика', names)
        self.assertIn('Дизайн', names)

    def test_anonymous_requires_auth(self):
        r = APIClient().get('/api/skill-categories/')
        self.assertEqual(r.status_code, 401)


# ── SkillProfiles API ─────────────────────────────────────────────────────────

class SkillProfilesAPITest(TestCase):
    def setUp(self):
        self.user = make_user('prof_api@test.com')
        self.client = auth_client(self.user)
        SkillProfile.objects.create(name='Управленец')
        SkillProfile.objects.create(name='Творческий')

    def test_list_returns_all_profiles(self):
        r = self.client.get('/api/profiles/')
        self.assertEqual(r.status_code, 200)
        names = [p['name'] for p in r.data]
        self.assertIn('Управленец', names)
        self.assertIn('Творческий', names)

    def test_anonymous_requires_auth(self):
        r = APIClient().get('/api/profiles/')
        self.assertEqual(r.status_code, 401)
