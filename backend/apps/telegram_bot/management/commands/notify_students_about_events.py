"""
Рассылка Telegram-уведомлений студентам о новых мероприятиях.

В отличие от notify_olympiad_updates (которая рассылает всем пользователям с Telegram),
эта команда отправляет только студентам и поддерживает фильтр по типу мероприятия.

Использование:
    python manage.py notify_students_about_events
    python manage.py notify_students_about_events --dry-run
    python manage.py notify_students_about_events --event-type HACKATHON
    python manage.py notify_students_about_events --since-hours 72
    python manage.py notify_students_about_events --run-parser --source hacklist
"""

import datetime

import telebot
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.events.models import Event
from apps.telegram_bot.models import TelegramProfile

MAX_EVENTS_IN_MESSAGE = 5

EVENT_TYPE_LABELS = {
    'OLYMPIAD': '🧠 Олимпиада',
    'HACKATHON': '💻 Хакатон',
    'COMPETITION': '🏆 Конкурс',
    'CONFERENCE': '🎓 Конференция',
    'GRANT': '💰 Грант',
}

EVENT_TYPE_HEADERS = {
    'OLYMPIAD': '🧠 Новые олимпиады на платформе!',
    'HACKATHON': '💻 Новые хакатоны на платформе!',
    'COMPETITION': '🏆 Новые конкурсы на платформе!',
    'CONFERENCE': '🎓 Новые конференции на платформе!',
    'GRANT': '💰 Новые гранты на платформе!',
    None: '🎉 Новые мероприятия на платформе!',
}


def _build_message(events_qs, total: int, event_type: str | None) -> str:
    header = EVENT_TYPE_HEADERS.get(event_type, EVENT_TYPE_HEADERS[None])
    lines = [f"<b>{header}</b>\n"]

    for event in events_qs[:MAX_EVENTS_IN_MESSAGE]:
        lines.append(f"📌 <b>{event.title}</b>")
        if event.event_type and not event_type:
            lines.append(f"🔖 Тип: {EVENT_TYPE_LABELS.get(event.event_type, event.event_type)}")
        if event.subject_area:
            lines.append(f"📚 Предмет: {event.subject_area}")
        if event.grade:
            lines.append(f"🎓 Классы/курсы: {event.grade}")
        if event.event_date:
            lines.append(f"📅 Дата: {event.event_date.strftime('%d.%m.%Y')}")
        elif event.year:
            lines.append(f"📅 Год: {event.year}")
        if event.organizer:
            lines.append(f"🏛 Организатор: {event.organizer}")
        if event.source_url:
            lines.append(f"🔗 {event.source_url}")
        lines.append("")

    if total > MAX_EVENTS_IN_MESSAGE:
        lines.append(
            f"<i>Показано {MAX_EVENTS_IN_MESSAGE} из {total}. "
            f"Все мероприятия — на платформе.</i>\n"
        )

    lines.append("<i>Чтобы отключить уведомления, отправьте /stop</i>")
    return "\n".join(lines)


def _build_keyboard(total: int) -> telebot.types.InlineKeyboardMarkup | None:
    if total <= MAX_EVENTS_IN_MESSAGE:
        return None
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    if "localhost" in frontend_url or "127.0.0.1" in frontend_url:
        return None
    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(telebot.types.InlineKeyboardButton(
        text=f"Все мероприятия ({total}) →",
        url=f"{frontend_url}/events",
    ))
    return markup


class Command(BaseCommand):
    help = "Рассылка Telegram-уведомлений студентам о новых мероприятиях"

    def add_arguments(self, parser):
        parser.add_argument(
            "--event-type",
            type=str,
            default=None,
            choices=[c[0] for c in Event.EventType.choices],
            help=(
                "Тип мероприятия для фильтрации: "
                "OLYMPIAD, HACKATHON, COMPETITION, CONFERENCE, GRANT. "
                "По умолчанию — все типы."
            ),
        )
        parser.add_argument(
            "--since-hours",
            type=int,
            default=25,
            help="Считать новыми события, добавленные в последние N часов (по умолчанию: 25)",
        )
        parser.add_argument(
            "--run-parser",
            action="store_true",
            default=False,
            help="Запустить парсер перед отправкой уведомлений",
        )
        parser.add_argument(
            "--source",
            type=str,
            default=None,
            help="Ключ парсера (например hacklist). Используется вместе с --run-parser.",
        )
        parser.add_argument(
            "--years",
            type=int,
            nargs="+",
            default=None,
            help="Учебные годы для парсера. По умолчанию — текущий год.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Только вывод без отправки сообщений",
        )

    def handle(self, *args, **options):
        event_type = options["event_type"]
        since_hours = options["since_hours"]
        dry_run = options["dry_run"]

        if options["run_parser"]:
            self._run_parsers(options["source"], options["years"] or [timezone.now().year])

        cutoff = timezone.now() - datetime.timedelta(hours=since_hours)
        events_qs = Event.objects.filter(is_active=True, parsed_at__gte=cutoff)
        if event_type:
            events_qs = events_qs.filter(event_type=event_type)

        total = events_qs.count()
        if total == 0:
            type_label = f" типа {event_type}" if event_type else ""
            self.stdout.write(self.style.WARNING(
                f"Нет новых мероприятий{type_label} за последние {since_hours} ч. "
                f"Уведомления не отправлены."
            ))
            return

        self.stdout.write(self.style.HTTP_INFO(f"Найдено новых мероприятий: {total}"))

        message_text = _build_message(events_qs, total, event_type)
        keyboard = _build_keyboard(total)

        recipients_qs = TelegramProfile.objects.filter(
            is_active=True,
            user__is_active=True,
            user__is_deleted=False,
            user__role='STUDENT',
        ).select_related("user")

        if dry_run:
            recipient_count = recipients_qs.count()
            self.stdout.write(self.style.SUCCESS(
                f"[dry-run] Новых мероприятий: {total}, "
                f"студентов с Telegram: {recipient_count}"
            ))
            return

        from apps.telegram_bot.services import send_custom_message

        sent = 0
        failed = 0
        for profile in recipients_qs.iterator():
            try:
                send_custom_message(
                    profile.chat_id, message_text,
                    parse_mode="HTML", reply_markup=keyboard,
                )
                sent += 1
            except Exception as exc:
                self.stderr.write(
                    f"Ошибка отправки студенту {profile.user}: {exc}"
                )
                failed += 1

        self.stdout.write(self.style.SUCCESS(
            f"Уведомлений отправлено: {sent}, ошибок: {failed}"
        ))

    def _run_parsers(self, source, years):
        from apps.events.management.commands.parse_events import PARSERS

        if source:
            if source not in PARSERS:
                self.stderr.write(
                    f"Неизвестный парсер: {source}. Доступные: {list(PARSERS.keys())}"
                )
                return
            parsers_to_run = {source: PARSERS[source]}
        else:
            parsers_to_run = PARSERS

        for name, parser_cls in parsers_to_run.items():
            self.stdout.write(f"Запуск парсера: {name}, годы: {years}")
            try:
                created, updated = parser_cls(years=years).run()
                self.stdout.write(self.style.SUCCESS(
                    f"{name}: создано {created}, обновлено {updated}"
                ))
            except Exception as exc:
                self.stderr.write(f"Ошибка в парсере {name}: {exc}")
