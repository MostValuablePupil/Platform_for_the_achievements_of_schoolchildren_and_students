"""
Парсер олимпиад Высшей школы экономики (olymp.hse.ru).

Источник: https://olymp.hse.ru/
Главная страница использует JavaScript для отображения списка олимпиад,
поэтому парсер обращается к известным страницам отдельных олимпиад ВШЭ
и извлекает метаданные из их статического HTML.
"""

import logging
import re
import time

import requests
from bs4 import BeautifulSoup

from apps.events.models import Event
from apps.events.parsers import BaseSiteParser

logger = logging.getLogger(__name__)

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; AchievementPlatformBot/1.0)"}
BASE_URL = "https://olymp.hse.ru"

# Известные страницы олимпиад ВШЭ — обновляются по мере обнаружения новых
KNOWN_OLYMPIAD_SLUGS = [
    "mmo",         # Олимпиада школьников «Высшая проба»
    "inter",       # Международная олимпиада молодежи
]

# Пути, которые не являются страницами олимпиад
_NON_OLYMPIAD_PATHS = {
    "news", "archive", "search", "volunteers", "schedule",
    "contacts", "about", "registration", "results",
}


class HseOlympParser(BaseSiteParser):
    """
    Парсер олимпиад ВШЭ с olymp.hse.ru.

    Стратегия:
    1. Загружает главную страницу и ищет ссылки вида /SLUG/ на отдельные олимпиады.
    2. Добавляет к найденным ссылкам известный список KNOWN_OLYMPIAD_SLUGS.
    3. Для каждой страницы олимпиады извлекает название, описание, предмет, классы.
    """

    source = Event.Source.HSE_OLYMP
    source_name = "ВШЭ Олимпиады"
    ORGANIZER = "НИУ ВШЭ (Высшая школа экономики)"

    def __init__(self, years: list[int] | None = None):
        self.years = years or [2025]

    def _fetch(self, url: str) -> BeautifulSoup | None:
        try:
            response = requests.get(url, timeout=15, headers=HEADERS)
            response.raise_for_status()
        except requests.RequestException as exc:
            logger.error("Ошибка запроса %s: %s", url, exc)
            return None
        return BeautifulSoup(response.text, "lxml")

    def _discover_olympiad_slugs(self) -> set[str]:
        """Ищет ссылки на олимпиады в статическом HTML главной страницы."""
        slugs: set[str] = set()
        soup = self._fetch(f"{BASE_URL}/")
        if soup is None:
            return slugs

        slug_pattern = re.compile(r"^https?://olymp\.hse\.ru/([a-zA-Z0-9_-]+)/?$")
        for a in soup.find_all("a", href=True):
            href = a["href"]
            # Преобразовать относительный в абсолютный
            if href.startswith("/") and not href.startswith("//"):
                href = f"{BASE_URL}{href}"
            m = slug_pattern.match(href)
            if m:
                slug = m.group(1).lower()
                if slug not in _NON_OLYMPIAD_PATHS:
                    slugs.add(slug)

        if slugs:
            logger.info("Найдено динамических ссылок на олимпиады: %s", slugs)
        return slugs

    def _parse_olympiad_page(self, slug: str) -> dict | None:
        """Загружает страницу олимпиады и извлекает метаданные."""
        url = f"{BASE_URL}/{slug}/"
        soup = self._fetch(url)
        if soup is None:
            return None

        # Заголовок — из <title>; h1 рендерится JS-ом и недоступен статически
        title_tag = soup.find("title")
        if title_tag:
            raw = title_tag.get_text(strip=True)
            # Убираем суффикс "– Национальный исследовательский университет..."
            title = raw.split(" – ")[0].split(" — ")[0].strip()
        else:
            title = slug

        if not title or len(title) < 3:
            logger.warning("Олимпиада %s: не найден заголовок", slug)
            return None

        # Описание: первый значимый абзац (исключаем cookie-уведомления и технические тексты)
        _skip_keywords = ("cookie", "cookies", "файлы", "браузер", "пользователь",
                          "настройках", "персональных данных", "продолжая пользоваться")
        description = ""
        for p in soup.find_all("p"):
            txt = p.get_text(strip=True)
            if txt and len(txt) > 30:
                lower = txt.lower()
                if not any(kw in lower for kw in _skip_keywords):
                    description = txt[:500]
                    break

        # Предмет и классы — попытка найти в meta description или тексте страницы
        subject = ""
        grades = ""
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc:
            meta_content = meta_desc.get("content", "")
            # Ищем шаблоны: "9–11 классы" или "студентов"
            grade_match = re.search(r"\d[\d–-]+\s*класс", meta_content, re.IGNORECASE)
            if grade_match:
                grades = grade_match.group(0)

        if not description:
            description = f"Олимпиада Вышки: «{title}»."

        return {
            "title": title,
            "description": description,
            "event_type": Event.EventType.OLYMPIAD,
            "source": self.source,
            "source_url": url,
            "subject_area": subject,
            "region": "Москва",
            "grade": grades,
            "year": "",
            "organizer": self.ORGANIZER,
        }

    def fetch_events(self) -> list[dict]:
        # Шаг 1: Обнаружить ссылки из статического HTML
        discovered_slugs = self._discover_olympiad_slugs()

        # Шаг 2: Объединить с известными слагами
        all_slugs = discovered_slugs | set(KNOWN_OLYMPIAD_SLUGS)
        logger.info("Всего слагов для проверки: %d", len(all_slugs))

        events = []
        seen_urls: set = set()

        for slug in sorted(all_slugs):
            url = f"{BASE_URL}/{slug}/"
            if url in seen_urls:
                continue

            event = self._parse_olympiad_page(slug)
            if event:
                seen_urls.add(url)
                events.append(event)
                logger.info("Добавлена олимпиада: %s (%s)", event["title"], url)
            else:
                logger.debug("Слаг %s: страница не найдена или пустая", slug)

            time.sleep(0.5)

        return events
