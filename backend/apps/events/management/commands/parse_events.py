"""
Management command для парсинга мероприятий с внешних сайтов.

Использование:
    python manage.py parse_events                     # Все парсеры (по умолчанию 2025 год)
    python manage.py parse_events --source urfu_izumrud
    python manage.py parse_events --years 2024 2025   # Несколько лет
"""

from django.core.management.base import BaseCommand

from apps.events.parsers.urfu_izumrud import UrfuIzumrudParser


# Реестр доступных парсеров
PARSERS = {
    'urfu_izumrud': UrfuIzumrudParser,
}


class Command(BaseCommand):
    help = 'Парсинг результатов олимпиад с внешних сайтов'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            type=str,
            choices=list(PARSERS.keys()),
            help='Конкретный источник для парсинга',
        )
        parser.add_argument(
            '--years',
            type=int,
            nargs='+',
            default=[2025],
            help='Учебные годы для парсинга (по умолчанию: 2025)',
        )

    def handle(self, *args, **options):
        source = options.get('source')
        years = options.get('years', [2025])

        if source:
            parsers_to_run = {source: PARSERS[source]}
        else:
            parsers_to_run = PARSERS

        total_created = 0
        total_updated = 0

        for name, parser_cls in parsers_to_run.items():
            self.stdout.write(f"\n{'='*60}")
            self.stdout.write(self.style.HTTP_INFO(f"🔍 Запуск парсера: {name}"))
            self.stdout.write(f"📅 Годы: {years}")
            self.stdout.write(f"{'='*60}")

            try:
                parser = parser_cls(years=years)
                created, updated = parser.run()
                total_created += created
                total_updated += updated

                self.stdout.write(self.style.SUCCESS(
                    f"✅ {name}: создано {created}, обновлено {updated}"
                ))
            except Exception as exc:
                self.stdout.write(self.style.ERROR(
                    f"❌ Ошибка в парсере {name}: {exc}"
                ))

        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(self.style.SUCCESS(
            f"🏁 Итого: создано {total_created}, обновлено {total_updated}"
        ))
