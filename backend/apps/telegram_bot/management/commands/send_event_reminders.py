"""
Отправка Telegram-напоминаний об отслеживаемых мероприятиях.

Запускается ежедневно и отправляет напоминания пользователям,
у которых мероприятие наступает через 1 или 3 дня.

Использование:
    python manage.py send_event_reminders
    python manage.py send_event_reminders --dry-run
"""

from datetime import date, timedelta

from django.core.management.base import BaseCommand

from apps.events.models import EventTracking
from apps.telegram_bot.services import send_custom_message


class Command(BaseCommand):
    help = "Отправка Telegram-напоминаний об отслеживаемых мероприятиях"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Только вывод без отправки сообщений",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        today = date.today()
        reminder_days = [1, 3]

        sent = 0
        failed = 0
        skipped = 0

        for days_ahead in reminder_days:
            target_date = today + timedelta(days=days_ahead)

            trackings = (
                EventTracking.objects
                .filter(
                    event__event_date=target_date,
                    event__is_active=True,
                    user__is_active=True,
                    user__is_deleted=False,
                )
                .select_related('event', 'user__telegram_profile')
            )

            for tracking in trackings:
                profile = getattr(tracking.user, 'telegram_profile', None)
                if not profile or not profile.is_active:
                    skipped += 1
                    continue

                days_label = "завтра" if days_ahead == 1 else f"через {days_ahead} дня"
                text = (
                    f"⏰ <b>Напоминание о мероприятии!</b>\n\n"
                    f"📌 <b>{tracking.event.title}</b>\n"
                    f"📅 Дата: {target_date.strftime('%d.%m.%Y')} ({days_label})\n"
                )
                if tracking.event.subject_area:
                    text += f"📚 Предмет: {tracking.event.subject_area}\n"
                if tracking.event.source_url:
                    text += f"🔗 {tracking.event.source_url}\n"
                text += "\n<i>Управление уведомлениями: /stop</i>"

                if dry_run:
                    self.stdout.write(
                        f"[dry-run] {tracking.user} ← «{tracking.event.title}» ({days_label})"
                    )
                    sent += 1
                    continue

                try:
                    send_custom_message(profile.chat_id, text, parse_mode="HTML")
                    sent += 1
                except Exception as exc:
                    self.stderr.write(
                        f"Ошибка отправки пользователю {tracking.user}: {exc}"
                    )
                    failed += 1

        prefix = "[dry-run] " if dry_run else ""
        self.stdout.write(
            self.style.SUCCESS(
                f"{prefix}Напоминаний отправлено: {sent}, пропущено (нет TG): {skipped}, ошибок: {failed}"
            )
        )
