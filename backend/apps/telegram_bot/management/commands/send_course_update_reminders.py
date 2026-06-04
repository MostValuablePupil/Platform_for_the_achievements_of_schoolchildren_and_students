from django.core.management.base import BaseCommand

from apps.telegram_bot.models import TelegramProfile
from apps.telegram_bot.services import DEFAULT_COURSE_UPDATE_MESSAGE, send_custom_message


class Command(BaseCommand):
    help = "Send yearly reminders to update class or course."

    def add_arguments(self, parser):
        parser.add_argument(
            "--message",
            default=DEFAULT_COURSE_UPDATE_MESSAGE,
            help="Custom reminder message text.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show how many messages would be sent without sending them.",
        )

    def handle(self, *args, **options):
        profiles = TelegramProfile.objects.select_related("user").filter(
            is_active=True,
            user__is_active=True,
            user__is_deleted=False,
        )
        message = options["message"]

        if options["dry_run"]:
            self.stdout.write(f"Would send {profiles.count()} Telegram reminders.")
            return

        sent = 0
        failed = 0

        for profile in profiles.iterator():
            try:
                send_custom_message(profile.chat_id, message)
                sent += 1
            except Exception as exc:
                failed += 1
                self.stderr.write(f"Failed to send message to {profile.chat_id}: {exc}")

        self.stdout.write(self.style.SUCCESS(f"Sent: {sent}. Failed: {failed}."))
