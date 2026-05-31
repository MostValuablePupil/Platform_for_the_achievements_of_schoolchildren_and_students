from io import StringIO
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.events.models import Event
from apps.telegram_bot.models import TelegramProfile

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(**kwargs):
    username = kwargs.pop("username", "user@test.com")
    defaults = dict(username=username, email=kwargs.pop("email", username), password="pass", is_active=True)
    defaults.update(kwargs)
    return User.objects.create_user(**defaults)


def make_profile(user, chat_id=111111, username="tg_user", is_active=True):
    return TelegramProfile.objects.create(user=user, chat_id=chat_id, username=username, is_active=is_active)


def make_event(**kwargs):
    defaults = dict(
        title="Тестовая олимпиада",
        source=Event.Source.URFU_IZUMRUD,
        source_url=f"https://example.com/event-{Event.objects.count()}",
        is_active=True,
    )
    defaults.update(kwargs)
    return Event.objects.create(**defaults)


def auth_client(user):
    token, _ = Token.objects.get_or_create(user=user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


class BotCapture:
    """
    Подставляется вместо telebot.TeleBot в тестах.
    Регистрирует хендлеры через декоратор и записывает ответы бота.
    """
    def __init__(self):
        self.handlers = {}
        self.replies = []

    def message_handler(self, commands=None, **_kwargs):
        def decorator(func):
            for cmd in (commands or []):
                self.handlers[cmd] = func
            return func
        return decorator

    def reply_to(self, _message, text, **_kwargs):
        self.replies.append(text)

    def infinity_polling(self, **_kwargs):
        pass

    def trigger(self, cmd, text, chat_id=999999, username="u"):
        msg = MagicMock()
        msg.text = text
        msg.chat.id = chat_id
        msg.from_user.username = username
        self.handlers[cmd](msg)
        return msg


# ---------------------------------------------------------------------------
# API: GenerateTelegramLinkView
# ---------------------------------------------------------------------------

class GenerateLinkViewTest(TestCase):

    def setUp(self):
        self.user = make_user()
        self.client = auth_client(self.user)
        cache.clear()

    def test_anonymous_returns_401(self):
        r = APIClient().post("/api/telegram/generate-link/")
        self.assertEqual(r.status_code, 401)

    def test_success_returns_code_and_stores_in_cache(self):
        r = self.client.post("/api/telegram/generate-link/")
        self.assertEqual(r.status_code, 200)
        code = r.data["code"]
        self.assertEqual(len(code), 8)
        self.assertEqual(cache.get(f"tg_link_{code}"), self.user.id)
        self.assertEqual(r.data["expires_in"], 600)

    def test_already_linked_returns_400(self):
        make_profile(self.user)
        r = self.client.post("/api/telegram/generate-link/")
        self.assertEqual(r.status_code, 400)
        self.assertIn("уже привязан", r.data["detail"])


# ---------------------------------------------------------------------------
# API: TelegramLinkStatusView
# ---------------------------------------------------------------------------

class LinkStatusViewTest(TestCase):

    def setUp(self):
        self.user = make_user()
        self.client = auth_client(self.user)

    def test_anonymous_returns_401(self):
        r = APIClient().get("/api/telegram/link-status/")
        self.assertEqual(r.status_code, 401)

    def test_not_linked(self):
        r = self.client.get("/api/telegram/link-status/")
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.data["is_linked"])
        self.assertIsNone(r.data["telegram_username"])

    def test_linked_with_username(self):
        make_profile(self.user, username="myhandle")
        r = self.client.get("/api/telegram/link-status/")
        self.assertTrue(r.data["is_linked"])
        self.assertEqual(r.data["telegram_username"], "myhandle")

    def test_linked_without_username_returns_none(self):
        make_profile(self.user, username="")
        r = self.client.get("/api/telegram/link-status/")
        self.assertTrue(r.data["is_linked"])
        self.assertIsNone(r.data["telegram_username"])


# ---------------------------------------------------------------------------
# API: TelegramUnlinkView
# ---------------------------------------------------------------------------

class UnlinkViewTest(TestCase):

    def setUp(self):
        self.user = make_user()
        self.client = auth_client(self.user)

    def test_anonymous_returns_401(self):
        r = APIClient().delete("/api/telegram/unlink/")
        self.assertEqual(r.status_code, 401)

    def test_not_linked_returns_404(self):
        r = self.client.delete("/api/telegram/unlink/")
        self.assertEqual(r.status_code, 404)

    def test_success_deletes_profile(self):
        make_profile(self.user)
        r = self.client.delete("/api/telegram/unlink/")
        self.assertEqual(r.status_code, 204)
        self.assertFalse(TelegramProfile.objects.filter(user=self.user).exists())


# ---------------------------------------------------------------------------
# Bot command: /start
# ---------------------------------------------------------------------------

class BotStartCommandTest(TestCase):

    def setUp(self):
        cache.clear()
        self.bot = BotCapture()
        patcher = patch(
            "apps.telegram_bot.management.commands.run_telegram_bot.get_bot",
            return_value=self.bot,
        )
        patcher.start()
        self.addCleanup(patcher.stop)
        from apps.telegram_bot.management.commands.run_telegram_bot import Command
        Command().handle()

    def test_start_without_token_sends_info(self):
        self.bot.trigger("start", "/start", chat_id=123)
        self.assertIn("настройки профиля", self.bot.replies[-1])
        self.assertNotIn("chat_id", self.bot.replies[-1])

    def test_start_without_token_reactivates_inactive_profile(self):
        user = make_user(username="u2@t.com")
        make_profile(user, chat_id=555, is_active=False)
        self.bot.trigger("start", "/start", chat_id=555)
        self.assertTrue(TelegramProfile.objects.get(chat_id=555).is_active)
        self.assertIn("включены", self.bot.replies[-1])

    def test_start_with_invalid_token_sends_error(self):
        self.bot.trigger("start", "/start BADCODE", chat_id=123)
        self.assertIn("недействителен", self.bot.replies[-1])

    def test_start_with_valid_token_creates_profile(self):
        user = make_user(username="u3@t.com")
        cache.set("tg_link_ABCD1234", user.id, timeout=600)
        self.bot.trigger("start", "/start ABCD1234", chat_id=777, username="tguser")
        self.assertTrue(TelegramProfile.objects.filter(user=user, chat_id=777).exists())
        self.assertIsNone(cache.get("tg_link_ABCD1234"))
        self.assertIn("привязан", self.bot.replies[-1])

    def test_start_with_valid_token_chat_id_already_taken(self):
        user1 = make_user(username="u4@t.com")
        user2 = make_user(username="u5@t.com")
        make_profile(user1, chat_id=888)
        cache.set("tg_link_ZZZZZZZZ", user2.id, timeout=600)
        self.bot.trigger("start", "/start ZZZZZZZZ", chat_id=888)
        self.assertIn("другому аккаунту", self.bot.replies[-1])
        self.assertFalse(TelegramProfile.objects.filter(user=user2).exists())

    def test_start_with_valid_token_user_already_has_profile(self):
        user = make_user(username="u6@t.com")
        make_profile(user, chat_id=100)
        cache.set("tg_link_DUPTOKEN", user.id, timeout=600)
        # Другой chat_id для того же user → IntegrityError (OneToOne)
        self.bot.trigger("start", "/start DUPTOKEN", chat_id=200)
        self.assertIn("уже привязан", self.bot.replies[-1])


# ---------------------------------------------------------------------------
# Bot command: /link
# ---------------------------------------------------------------------------

class BotLinkCommandTest(TestCase):

    def setUp(self):
        cache.clear()
        self.bot = BotCapture()
        patcher = patch(
            "apps.telegram_bot.management.commands.run_telegram_bot.get_bot",
            return_value=self.bot,
        )
        patcher.start()
        self.addCleanup(patcher.stop)
        from apps.telegram_bot.management.commands.run_telegram_bot import Command
        Command().handle()

    def test_link_without_token_sends_usage(self):
        self.bot.trigger("link", "/link", chat_id=1)
        self.assertIn("Использование", self.bot.replies[-1])

    def test_link_with_valid_token_creates_profile(self):
        user = make_user(username="lu@t.com")
        cache.set("tg_link_LINKCODE", user.id, timeout=600)
        self.bot.trigger("link", "/link LINKCODE", chat_id=321)
        self.assertTrue(TelegramProfile.objects.filter(user=user, chat_id=321).exists())


# ---------------------------------------------------------------------------
# Bot command: /unlink
# ---------------------------------------------------------------------------

class BotUnlinkCommandTest(TestCase):

    def setUp(self):
        self.bot = BotCapture()
        patcher = patch(
            "apps.telegram_bot.management.commands.run_telegram_bot.get_bot",
            return_value=self.bot,
        )
        patcher.start()
        self.addCleanup(patcher.stop)
        from apps.telegram_bot.management.commands.run_telegram_bot import Command
        Command().handle()

    def test_unlink_when_linked_deletes_profile(self):
        user = make_user(username="unl@t.com")
        make_profile(user, chat_id=444)
        self.bot.trigger("unlink", "/unlink", chat_id=444)
        self.assertFalse(TelegramProfile.objects.filter(chat_id=444).exists())
        self.assertIn("отвязан", self.bot.replies[-1])

    def test_unlink_when_not_linked_sends_error(self):
        self.bot.trigger("unlink", "/unlink", chat_id=9999)
        self.assertIn("не привязан", self.bot.replies[-1])


# ---------------------------------------------------------------------------
# Bot command: /stop
# ---------------------------------------------------------------------------

class BotStopCommandTest(TestCase):

    def setUp(self):
        self.bot = BotCapture()
        patcher = patch(
            "apps.telegram_bot.management.commands.run_telegram_bot.get_bot",
            return_value=self.bot,
        )
        patcher.start()
        self.addCleanup(patcher.stop)
        from apps.telegram_bot.management.commands.run_telegram_bot import Command
        Command().handle()

    def test_stop_deactivates_profile(self):
        user = make_user(username="stop@t.com")
        make_profile(user, chat_id=666)
        self.bot.trigger("stop", "/stop", chat_id=666)
        self.assertFalse(TelegramProfile.objects.get(chat_id=666).is_active)
        self.assertIn("отключены", self.bot.replies[-1])

    def test_stop_when_not_linked_sends_error(self):
        self.bot.trigger("stop", "/stop", chat_id=7777)
        self.assertIn("не привязан", self.bot.replies[-1])


# ---------------------------------------------------------------------------
# Management command: notify_olympiad_updates
# ---------------------------------------------------------------------------

class NotifyOlympiadUpdatesTest(TestCase):

    def setUp(self):
        cache.clear()

    @patch("apps.telegram_bot.management.commands.notify_olympiad_updates.send_custom_message")
    def test_no_events_prints_warning_and_does_not_send(self, mock_send):
        out = StringIO()
        call_command("notify_olympiad_updates", "--since-hours", "1", stdout=out)
        mock_send.assert_not_called()
        self.assertIn("Нет новых событий", out.getvalue())

    @patch("apps.telegram_bot.management.commands.notify_olympiad_updates.send_custom_message")
    def test_sends_to_active_profiles(self, mock_send):
        user = make_user(username="rcv@t.com")
        make_profile(user, chat_id=123)
        make_event(title="Олимпиада 1", source_url="https://ex.com/1")
        call_command("notify_olympiad_updates", "--since-hours", "99999")
        mock_send.assert_called_once()
        args = mock_send.call_args
        self.assertEqual(args[0][0], 123)
        self.assertIn("Олимпиада 1", args[0][1])

    @patch("apps.telegram_bot.management.commands.notify_olympiad_updates.send_custom_message")
    def test_does_not_send_to_inactive_profiles(self, mock_send):
        user = make_user(username="inact@t.com")
        make_profile(user, chat_id=456, is_active=False)
        make_event(source_url="https://ex.com/2")
        call_command("notify_olympiad_updates", "--since-hours", "99999")
        mock_send.assert_not_called()

    @patch("apps.telegram_bot.management.commands.notify_olympiad_updates.send_custom_message")
    def test_dry_run_does_not_send(self, mock_send):
        user = make_user(username="dry@t.com")
        make_profile(user, chat_id=789)
        make_event(source_url="https://ex.com/3")
        out = StringIO()
        call_command("notify_olympiad_updates", "--since-hours", "99999", "--dry-run", stdout=out)
        mock_send.assert_not_called()
        self.assertIn("dry-run", out.getvalue())

    @patch("apps.telegram_bot.management.commands.notify_olympiad_updates.send_custom_message")
    def test_failed_send_does_not_abort_others(self, mock_send):
        user1 = make_user(username="ok@t.com")
        user2 = make_user(username="fail@t.com")
        make_profile(user1, chat_id=11)
        make_profile(user2, chat_id=22)
        make_event(source_url="https://ex.com/4")

        mock_send.side_effect = [Exception("network error"), None]
        out = StringIO()
        err = StringIO()
        call_command("notify_olympiad_updates", "--since-hours", "99999", stdout=out, stderr=err)
        self.assertEqual(mock_send.call_count, 2)
        self.assertIn("ошибок: 1", out.getvalue())


# ---------------------------------------------------------------------------
# Management command: send_course_update_reminders
# ---------------------------------------------------------------------------

class SendCourseUpdateRemindersTest(TestCase):

    @patch("apps.telegram_bot.management.commands.send_course_update_reminders.send_custom_message")
    def test_dry_run_does_not_send(self, mock_send):
        user = make_user(username="cdr@t.com")
        make_profile(user, chat_id=555)
        out = StringIO()
        call_command("send_course_update_reminders", "--dry-run", stdout=out)
        mock_send.assert_not_called()
        self.assertIn("1", out.getvalue())

    @patch("apps.telegram_bot.management.commands.send_course_update_reminders.send_custom_message")
    def test_sends_to_active_profiles(self, mock_send):
        user = make_user(username="cds@t.com")
        make_profile(user, chat_id=666)
        call_command("send_course_update_reminders")
        mock_send.assert_called_once_with(666, mock_send.call_args[0][1])

    @patch("apps.telegram_bot.management.commands.send_course_update_reminders.send_custom_message")
    def test_custom_message_is_sent(self, mock_send):
        user = make_user(username="cdm@t.com")
        make_profile(user, chat_id=777)
        call_command("send_course_update_reminders", "--message", "Привет!")
        self.assertEqual(mock_send.call_args[0][1], "Привет!")

    @patch("apps.telegram_bot.management.commands.send_course_update_reminders.send_custom_message")
    def test_does_not_send_to_inactive_profiles(self, mock_send):
        user = make_user(username="cdi@t.com")
        make_profile(user, chat_id=888, is_active=False)
        call_command("send_course_update_reminders")
        mock_send.assert_not_called()
