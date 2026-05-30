from django.conf import settings
from django.db import models


class TelegramProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="telegram_profile",
        verbose_name="Пользователь",
    )
    chat_id = models.BigIntegerField(unique=True, verbose_name="Telegram chat ID")
    username = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Telegram username",
    )
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создан")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Обновлен")

    class Meta:
        verbose_name = "Telegram-профиль"
        verbose_name_plural = "Telegram-профили"

    def __str__(self):
        return f"{self.user} -> {self.chat_id}"

# Create your models here.
