from django.core.management.base import BaseCommand

from apps.telegram_bot.models import TelegramProfile
from apps.telegram_bot.services import get_bot


class Command(BaseCommand):
    help = "Run Telegram bot polling."

    def handle(self, *args, **options):
        bot = get_bot()

        @bot.message_handler(commands=["start"])
        def start(message):
            bot.reply_to(
                message,
                "Привет! Я бот платформы достижений. "
                f"Твой chat_id: {message.chat.id}. "
                "Передай его администратору, чтобы привязать Telegram к профилю.",
            )

        @bot.message_handler(commands=["id"])
        def chat_id(message):
            bot.reply_to(message, f"Твой Telegram chat_id: {message.chat.id}")

        @bot.message_handler(commands=["stop"])
        def stop_notifications(message):
            updated = TelegramProfile.objects.filter(chat_id=message.chat.id).update(is_active=False)
            if updated:
                bot.reply_to(message, "Уведомления отключены.")
            else:
                bot.reply_to(message, "Этот Telegram пока не привязан к профилю.")

        self.stdout.write(self.style.SUCCESS("Telegram bot polling started"))
        bot.infinity_polling(skip_pending=True)
