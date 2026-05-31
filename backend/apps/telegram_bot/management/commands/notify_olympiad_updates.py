"""
Отправка Telegram-уведомлений о новых олимпиадах.

Использование:
    python manage.py notify_olympiad_updates --dry-run
    python manage.py notify_olympiad_updates --run-parser
    python manage.py notify_olympiad_updates --run-parser --source urfu_izumrud --years 2025 2026
    python manage.py notify_olympiad_updates --since-hours 48
"""

import datetime

import telebot
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.events.models import Event
from apps.telegram_bot.models import TelegramProfile
from apps.telegram_bot.services import send_custom_message

MAX_EVENTS_IN_MESSAGE = 5


def _build_message(events_qs, total: int) -> str:
    lines = ["<b>🏆 Олимпиады на платформе достижений!</b>\n"]
    for event in events_qs[:MAX_EVENTS_IN_MESSAGE]:
        lines.append(f"📌 <b>{event.title}</b>")
        if event.subject_area:
            lines.append(f"📚 Предмет: {event.subject_area}")
        if event.grade:
            lines.append(f"🎓 Классы/курсы: {event.grade}")
        if event.year:
            lines.append(f"📅 Год: {event.year}")
        if event.source_url:
            lines.append(f"🔗 {event.source_url}")
        lines.append("")

    if total > MAX_EVENTS_IN_MESSAGE:
        lines.append(f"<i>Показано {MAX_EVENTS_IN_MESSAGE} из {total}. Остальные — на платформе.</i>\n")

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
        text=f"Все олимпиады ({total}) →",
        url=f"{frontend_url}/events",
    ))
    return markup


class Command(BaseCommand):
    help = "Отправка Telegram-уведомлений о новых олимпиадах"

    def add_arguments(self, parser):
        parser.add_argument(
            "--run-parser",
            action="store_true",
            default=False,
            help="Запустить парсер событий перед проверкой БД",
        )
        parser.add_argument(
            "--source",
            type=str,
            default=None,
            help="Ключ парсера (например urfu_izumrud). По умолчанию — все.",
        )
        parser.add_argument(
            "--years",
            type=int,
            nargs="+",
            default=None,
            help="Учебные годы для парсера. По умолчанию — текущий год.",
        )
        parser.add_argument(
            "--since-hours",
            type=int,
            default=25,
            help="Считать новыми события, созданные в последние N часов (по умолчанию: 25)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Только логирование без отправки сообщений",
        )

    def handle(self, *args, **options):
        run_parser = options["run_parser"]
        source = options["source"]
        years = options["years"] or [timezone.now().year]
        since_hours = options["since_hours"]
        dry_run = options["dry_run"]

        if run_parser:
            self._run_parsers(source, years)

        cutoff = timezone.now() - datetime.timedelta(hours=since_hours)
        events = Event.objects.filter(is_active=True, parsed_at__gte=cutoff)
        total = events.count()

        if total == 0:
            self.stdout.write(self.style.WARNING(
                f"Нет новых событий олимпиад за последние {since_hours} ч. Уведомления не отправлены."
            ))
            return

        self.stdout.write(self.style.HTTP_INFO(f"Найдено новых событий: {total}"))
        message_text = _build_message(events, total)
        keyboard = _build_keyboard(total)

        recipients_qs = TelegramProfile.objects.filter(
            is_active=True,
            user__is_active=True,
            user__is_deleted=False,
        ).select_related("user")

        if dry_run:
            recipient_count = recipients_qs.count()
            self.stdout.write(self.style.SUCCESS(
                f"[dry-run] Найдено событий: {total}, получателей: {recipient_count}"
            ))
            return

        sent = 0
        failed = 0
        for profile in recipients_qs.iterator():
            try:
                send_custom_message(profile.chat_id, message_text, parse_mode="HTML", reply_markup=keyboard)
                sent += 1
            except Exception as exc:
                self.stderr.write(f"Ошибка отправки пользователю {profile.user}: {exc}")
                failed += 1

        self.stdout.write(self.style.SUCCESS(
            f"Уведомления отправлены: {sent}, ошибок: {failed}"
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
