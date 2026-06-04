import uuid

from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TelegramProfile
from .services import bot, send_custom_message, send_custom_message_to_user

__all__ = ("bot", "send_custom_message", "send_custom_message_to_user")


class GenerateTelegramLinkView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.telegram_profile
            return Response(
                {"detail": "Telegram уже привязан к вашему аккаунту."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except TelegramProfile.DoesNotExist:
            pass

        token = uuid.uuid4().hex[:8].upper()
        cache.set(f"tg_link_{token}", request.user.id, timeout=600)

        return Response({"code": token, "expires_in": 600})


class TelegramLinkStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.telegram_profile
            return Response({
                "is_linked": True,
                "telegram_username": profile.username or None,
            })
        except TelegramProfile.DoesNotExist:
            return Response({"is_linked": False, "telegram_username": None})


class TelegramUnlinkView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            request.user.telegram_profile.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TelegramProfile.DoesNotExist:
            return Response(
                {"detail": "Telegram не привязан."},
                status=status.HTTP_404_NOT_FOUND,
            )
