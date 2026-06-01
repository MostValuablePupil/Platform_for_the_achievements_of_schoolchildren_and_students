from django.core.management import call_command
from django.core.management.base import BaseCommand

from apps.users.models import User


TEST_USERS = [
    {
        "username": "student1",
        "email": "student1@test.com",
        "password": "Test1234!",
        "first_name": "Иван",
        "last_name": "Петров",
        "middle_name": "Сергеевич",
        "role": User.Role.STUDENT,
        "educational_institution": "МГТУ им. Баумана",
        "course": "3",
    },
    {
        "username": "student2",
        "email": "student2@test.com",
        "password": "Test1234!",
        "first_name": "Мария",
        "last_name": "Иванова",
        "middle_name": "",
        "role": User.Role.STUDENT,
        "educational_institution": "МГУ",
        "course": "2",
        "is_active": False,
    },
    {
        "username": "curator1",
        "email": "curator1@test.com",
        "password": "Test1234!",
        "first_name": "Ольга",
        "last_name": "Смирнова",
        "middle_name": "Николаевна",
        "role": User.Role.CURATOR,
        "educational_institution": "МГТУ им. Баумана",
    },
    {
        "username": "employer1",
        "email": "employer1@test.com",
        "password": "Test1234!",
        "first_name": "Алексей",
        "last_name": "Козлов",
        "middle_name": "",
        "role": User.Role.EMPLOYER,
        "organization": "Яндекс",
    },
    {
        "username": "admin1",
        "email": "admin1@test.com",
        "password": "Test1234!",
        "first_name": "Админ",
        "last_name": "Платформы",
        "middle_name": "",
        "role": User.Role.ADMIN,
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "username": "admin",
        "email": "admin@test.com",
        "password": "admin",
        "first_name": "Admin",
        "last_name": "Admin",
        "middle_name": "",
        "role": User.Role.ADMIN,
        "is_staff": True,
        "is_superuser": True,
    },
]


class Command(BaseCommand):
    help = "Загружает фикстуры и создаёт тестовые аккаунты"

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-fixtures",
            action="store_true",
            help="Пропустить загрузку фикстур",
        )
        parser.add_argument(
            "--no-users",
            action="store_true",
            help="Пропустить создание тестовых пользователей",
        )
        parser.add_argument(
            "--no-events",
            action="store_true",
            help="Пропустить парсинг мероприятий",
        )

    def handle(self, *args, **options):
        self._ensure_cache_table()

        if not options["no_fixtures"]:
            self._load_fixtures()

        if not options["no_users"]:
            self._create_users()

        if not options["no_events"]:
            self._parse_events()

        self.stdout.write(self.style.SUCCESS("Seed завершён успешно."))

    def _ensure_cache_table(self):
        try:
            call_command("createcachetable", verbosity=0)
            self.stdout.write(self.style.SUCCESS("  ✓ Таблица кэша готова"))
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"  ⚠ createcachetable: {exc}"))

    def _load_fixtures(self):
        fixtures = [
            "fixtures/specialties_fixture.json",
            "fixtures/skills_fixture.json",
            "fixtures/badges_fixture.json",
        ]
        for fixture in fixtures:
            self.stdout.write(f"  Загрузка {fixture}...")
            call_command("loaddata", fixture, verbosity=0)
            self.stdout.write(self.style.SUCCESS(f"  ✓ {fixture}"))

    def _create_users(self):
        self.stdout.write("  Создание тестовых пользователей...")
        created, skipped = 0, 0

        for data in TEST_USERS:
            username = data["username"]
            if User.objects.filter(username=username).exists():
                self.stdout.write(f"    — {username} уже существует, пропуск")
                skipped += 1
                continue

            password = data.pop("password")
            is_active = data.pop("is_active", True)
            user = User(**data, is_active=is_active)
            user.set_password(password)
            user.save()
            created += 1
            self.stdout.write(self.style.SUCCESS(f"    ✓ {username} ({data['role']})"))

        self.stdout.write(f"  Создано: {created}, пропущено: {skipped}")

    def _parse_events(self):
        self.stdout.write("  Парсинг мероприятий с внешних сайтов...")
        try:
            call_command("parse_events", verbosity=0)
            self.stdout.write(self.style.SUCCESS("  ✓ Мероприятия загружены"))
        except Exception as exc:
            self.stdout.write(self.style.WARNING(f"  ⚠ Ошибка при парсинге: {exc}"))
