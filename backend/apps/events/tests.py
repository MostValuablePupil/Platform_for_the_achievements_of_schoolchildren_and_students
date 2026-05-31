from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.events.models import Event

User = get_user_model()


def make_user(username='events_user@test.com'):
    return User.objects.create_user(
        username=username, email=username, password='testpass123',
        first_name='Test', last_name='User', is_active=True,
    )


def auth_client(user):
    token, _ = Token.objects.get_or_create(user=user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    return client


def make_event(title='Тестовая олимпиада', source=Event.Source.URFU_IZUMRUD,
               event_type=Event.EventType.OLYMPIAD, **kwargs):
    defaults = dict(
        title=title,
        source=source,
        source_url=f'https://example.com/event-{Event.objects.count() + 1}',
        event_type=event_type,
        is_active=True,
    )
    defaults.update(kwargs)
    return Event.objects.create(**defaults)


# ── ParsedEvents API: list ────────────────────────────────────────────────────

class ParsedEventListAPITest(TestCase):
    def setUp(self):
        self.user = make_user()
        self.client = auth_client(self.user)
        make_event('Олимпиада по математике', source=Event.Source.URFU_IZUMRUD,
                   event_type=Event.EventType.OLYMPIAD, subject_area='Математика', year='2025/26')
        make_event('Хакатон МФТИ', source=Event.Source.MIPT,
                   event_type=Event.EventType.HACKATHON, subject_area='Информатика', year='2025/26')
        make_event('Конкурс МГТУ', source=Event.Source.BMSTU,
                   event_type=Event.EventType.COMPETITION, subject_area='Физика', year='2024/25')

    def test_list_returns_all_events(self):
        r = self.client.get('/api/parsed-events/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 3)

    def test_anonymous_requires_auth(self):
        r = APIClient().get('/api/parsed-events/')
        self.assertEqual(r.status_code, 401)

    def test_filter_by_source(self):
        r = self.client.get(f'/api/parsed-events/?source={Event.Source.MIPT}')
        self.assertEqual(len(r.data), 1)
        self.assertEqual(r.data[0]['title'], 'Хакатон МФТИ')

    def test_filter_by_event_type(self):
        r = self.client.get(f'/api/parsed-events/?event_type={Event.EventType.OLYMPIAD}')
        titles = [e['title'] for e in r.data]
        self.assertIn('Олимпиада по математике', titles)
        self.assertNotIn('Хакатон МФТИ', titles)

    def test_filter_by_subject_area(self):
        r = self.client.get('/api/parsed-events/?subject_area=Математика')
        self.assertEqual(len(r.data), 1)
        self.assertEqual(r.data[0]['subject_area'], 'Математика')

    def test_filter_by_year(self):
        r = self.client.get('/api/parsed-events/?year=2025/26')
        years = [e['year'] for e in r.data]
        self.assertTrue(all(y == '2025/26' for y in years))

    def test_search_by_title(self):
        r = self.client.get('/api/parsed-events/?search=математик')
        titles = [e['title'] for e in r.data]
        self.assertIn('Олимпиада по математике', titles)


# ── ParsedEvents API: filters endpoint ───────────────────────────────────────

class ParsedEventFiltersAPITest(TestCase):
    def setUp(self):
        self.user = make_user('flt_events@test.com')
        self.client = auth_client(self.user)
        make_event(source=Event.Source.URFU_IZUMRUD, event_type=Event.EventType.OLYMPIAD,
                   subject_area='Математика', year='2025/26', region='Екатеринбург')
        make_event(source=Event.Source.MIPT, event_type=Event.EventType.HACKATHON,
                   subject_area='Информатика', year='2024/25', region='Москва')

    def test_filters_endpoint_returns_200(self):
        r = self.client.get('/api/parsed-events/filters/')
        self.assertEqual(r.status_code, 200)

    def test_filters_includes_sources(self):
        r = self.client.get('/api/parsed-events/filters/')
        self.assertIn('sources', r.data)

    def test_filters_includes_subject_areas(self):
        r = self.client.get('/api/parsed-events/filters/')
        self.assertIn('subject_areas', r.data)

    def test_filters_includes_years(self):
        r = self.client.get('/api/parsed-events/filters/')
        self.assertIn('years', r.data)
        self.assertIn('2025/26', r.data['years'])

    def test_filters_includes_regions(self):
        r = self.client.get('/api/parsed-events/filters/')
        self.assertIn('regions', r.data)


# ── ParsedEvent: serializer fields ───────────────────────────────────────────

class ParsedEventSerializerTest(TestCase):
    def setUp(self):
        self.user = make_user('ser_events@test.com')
        self.client = auth_client(self.user)
        make_event(source=Event.Source.URFU_IZUMRUD, event_type=Event.EventType.OLYMPIAD)

    def test_response_includes_source_display(self):
        r = self.client.get('/api/parsed-events/')
        self.assertIn('source_display', r.data[0])

    def test_response_includes_event_type_display(self):
        r = self.client.get('/api/parsed-events/')
        self.assertIn('event_type_display', r.data[0])
