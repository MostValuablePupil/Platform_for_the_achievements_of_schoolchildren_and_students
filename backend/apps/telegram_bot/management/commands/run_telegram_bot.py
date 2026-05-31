from django.core.cache import cache
from django.core.management.base import BaseCommand
from django.db import IntegrityError, transaction

from apps.telegram_bot.models import TelegramProfile
from apps.telegram_bot.services import get_bot


class Command(BaseCommand):
    help = "Run Telegram bot polling."

    def handle(self, *args, **options):
        bot = get_bot()

        def _handle_link(message, token):
            user_id = cache.get(f"tg_link_{token}")
            if user_id is None:
                bot.reply_to(
                    message,
                    "❌ Код недействителен или истёк. Получите новый код в настройках профиля на платформе.",
                )
                return

            chat_id = message.chat.id
            if TelegramProfile.objects.filter(chat_id=chat_id).exists():
                bot.reply_to(
                    message,
                    "⚠️ Этот Telegram уже привязан к другому аккаунту на платформе.",
                )
                return

            try:
                with transaction.atomic():
                    TelegramProfile.objects.create(
                        user_id=user_id,
                        chat_id=chat_id,
                        username=message.from_user.username or "",
                    )
                cache.delete(f"tg_link_{token}")
                bot.reply_to(
                    message,
                    "✅ Telegram успешно привязан к вашему аккаунту!\n\n"
                    "Теперь вы будете получать уведомления об олимпиадах и мероприятиях.\n\n"
                    "Чтобы отключить уведомления: /stop\n"
                    "Чтобы отвязать Telegram: /unlink",
                )
            except IntegrityError:
                cache.delete(f"tg_link_{token}")
                bot.reply_to(
                    message,
                    "⚠️ Этот аккаунт на платформе уже привязан к другому Telegram.",
                )
            except Exception:
                bot.reply_to(message, "⚠️ Произошла ошибка при привязке. Попробуйте позже.")

        @bot.message_handler(commands=["start"])
        def start(message):
            parts = message.text.split(maxsplit=1)
            token = parts[1].strip() if len(parts) > 1 else None

            if not token:
                existing = TelegramProfile.objects.filter(chat_id=message.chat.id).first()
                if existing and not existing.is_active:
                    existing.is_active = True
                    existing.save(update_fields=["is_active"])
                    bot.reply_to(message, "✅ Уведомления снова включены!")
                    return

                bot.reply_to(
                    message,
                    "Привет! Я бот платформы достижений.\n\n"
                    "Чтобы привязать Telegram к своему аккаунту, "
                    "перейди в настройки профиля и нажми «Привязать Telegram».",
                )
                return

            _handle_link(message, token)

        @bot.message_handler(commands=["link"])
        def link(message):
            parts = message.text.split(maxsplit=1)
            if len(parts) < 2 or not parts[1].strip():
                bot.reply_to(
                    message,
                    "Использование: /link <код>\n"
                    "Код можно получить в настройках профиля на платформе.",
                )
                return
            _handle_link(message, parts[1].strip())

        @bot.message_handler(commands=["unlink"])
        def unlink(message):
            deleted, _ = TelegramProfile.objects.filter(chat_id=message.chat.id).delete()
            if deleted:
                bot.reply_to(message, "✅ Telegram успешно отвязан от аккаунта на платформе.")
            else:
                bot.reply_to(message, "Этот Telegram не привязан ни к одному аккаунту на платформе.")

        @bot.message_handler(commands=["id"])
        def chat_id_cmd(message):
            bot.reply_to(message, f"Твой Telegram chat_id: {message.chat.id}")

        @bot.message_handler(commands=["stop"])
        def stop_notifications(message):
            updated = TelegramProfile.objects.filter(chat_id=message.chat.id).update(is_active=False)
            if updated:
                bot.reply_to(
                    message,
                    "Уведомления отключены.\n"
                    "Чтобы снова включить — отправь /start\n"
                    "Чтобы полностью отвязать Telegram — отправь /unlink",
                )
            else:
                bot.reply_to(message, "Этот Telegram пока не привязан к профилю.")

        self.stdout.write(self.style.SUCCESS("Telegram bot polling started"))
        bot.infinity_polling(skip_pending=True)
