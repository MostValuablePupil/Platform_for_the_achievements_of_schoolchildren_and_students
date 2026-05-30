import logging
import os

import telebot
from django.conf import settings

logger = logging.getLogger(__name__)

DEFAULT_COURSE_UPDATE_MESSAGE = (
    "Привет! Начался новый учебный год. "
    "Пожалуйста, обнови свой класс или курс в профиле платформы достижений."
)


def get_bot_token():
    return getattr(settings, "TELEGRAM_BOT_API_KEY", "") or os.getenv("TELEGRAM_BOT_API_KEY", "")


def get_bot():
    token = get_bot_token()
    if not token:
        raise RuntimeError("TELEGRAM_BOT_API_KEY is not configured")
    return telebot.TeleBot(token)


bot = get_bot() if get_bot_token() else None


def send_custom_message(chat_id, text, **kwargs):
    """
    Send any custom Telegram message by chat_id.

    Usage from another file:
        from apps.telegram_bot.services import send_custom_message
        send_custom_message(123456789, "Ваше сообщение")
    """
    if not text:
        raise ValueError("Message text cannot be empty")

    telegram_bot = bot or get_bot()
    return telegram_bot.send_message(chat_id, text, **kwargs)


def send_custom_message_to_user(user, text, **kwargs):
    """
    Send any custom Telegram message to a linked platform user.
    Returns Telegram API response or None if the user has no active Telegram profile.
    """
    telegram_profile = getattr(user, "telegram_profile", None)
    if not telegram_profile or not telegram_profile.is_active:
        logger.info("User %s has no active Telegram profile", user.pk)
        return None

    return send_custom_message(telegram_profile.chat_id, text, **kwargs)


def send_course_update_reminder(user, message=None, **kwargs):
    return send_custom_message_to_user(
        user,
        message or DEFAULT_COURSE_UPDATE_MESSAGE,
        **kwargs,
    )
