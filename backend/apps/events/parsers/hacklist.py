"""
Парсер хакатонов и IT-мероприятий с сайта hacklist.ru.

Источник: https://hacklist.ru/
Сайт рендерится на сервере (Next.js SSR), поэтому <article> теги доступны
в исходном HTML без JavaScript.
"""

import logging
import time

import requests
from bs4 import BeautifulSoup

from apps.events.models import Event
from apps.events.parsers import BaseSiteParser

logger = logging.getLogger(__name__)

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; AchievementPlatformBot/1.0)"}
BASE_URL = "https://hacklist.ru"
LIST_URL = f"{BASE_URL}/"
MAX_PAGES = 10


class HacklistParser(BaseSiteParser):
    """
    Парсер хакатонов с hacklist.ru.
    Страница использует Next.js с серверным рендерингом, <article>-теги
    содержат данные в исходном HTML без JS.
    """

    source = Event.Source.HACKLIST
    source_name = "Hacklist (хакатоны)"

    def __init__(self, years: list[int] | None = None):
        self.years = years or [2025]

    def _fetch_page(self, url: str) -> BeautifulSoup | None:
        try:
            response = requests.get(url, timeout=15, headers=HEADERS)
            response.raise_for_status()
        except requests.RequestException as exc:
            logger.error("Ошибка запроса %s: %s", url, exc)
            return None
        return BeautifulSoup(response.text, "lxml")

    def _parse_articles(self, soup: BeautifulSoup, seen_urls: set) -> list[dict]:
        events = []
        articles = soup.find_all("article")
        for article in articles:
            try:
                # Ссылка на деталь — /hackathons/ или /itevents/ (не /events/tags/ и т.п.)
                first_link = article.find("a", href=True)
                if not first_link:
                    continue
                href = first_link["href"]
                if not (href.startswith("/hackathons/") or href.startswith("/itevents/")):
                    continue
                # Пропускаем «рекламные» статьи-аннонсы (слаг совпадает с корнем: /hackathons/hackathons/)
                if href in ("/hackathons/hackathons/", "/hackathons/"):
                    continue
                source_url = f"{BASE_URL}{href}"
                if source_url in seen_urls:
                    continue
                seen_urls.add(source_url)

                # Заголовок
                h3 = article.find("h3")
                if not h3:
                    continue
                title = h3.get_text(strip=True)

                # Дата
                time_tag = article.find("time")
                date_str = ""
                if time_tag:
                    date_str = time_tag.get("datetime", "") or time_tag.get_text(strip=True)

                # Формат (Онлайн / Офлайн / город) — первый <span> в карточке
                first_span = article.find("span")
                format_text = first_span.get_text(strip=True) if first_span else ""

                # Дополнительный текст (призовой фонд, стажировка и т.п.) —
                # ищем div с зелёным цветом (цвет #2d9e2d) или просто второй div
                prize_text = ""
                all_divs = article.find_all("div")
                for div in all_divs:
                    txt = div.get_text(strip=True)
                    style = div.get("style", "")
                    if "2d9e2d" in style or "green" in style.lower():
                        prize_text = txt
                        break

                # Теги (категории)
                tag_links = article.find_all("a", href=lambda h: h and "/events/tags/" in h)
                tags = [t.get_text(strip=True) for t in tag_links if t.get_text(strip=True)]

                description_parts = []
                if date_str:
                    description_parts.append(f"Дата: {date_str}.")
                if prize_text:
                    description_parts.append(prize_text)
                if tags:
                    description_parts.append(f"Теги: {', '.join(tags)}.")
                description = " ".join(description_parts) if description_parts else title

                events.append({
                    "title": title,
                    "description": description,
                    "event_type": Event.EventType.HACKATHON,
                    "source": self.source,
                    "source_url": source_url,
                    "subject_area": ", ".join(tags) if tags else "",
                    "region": format_text,
                    "grade": "",
                    "year": date_str[:4] if len(date_str) >= 4 else "",
                    "organizer": "",
                    "event_date": date_str[:10] if date_str and len(date_str) >= 10 else None,
                })

            except Exception as exc:
                logger.warning("Ошибка при обработке article: %s", exc)
                continue

        return events

    def fetch_events(self) -> list[dict]:
        seen_urls: set = set()
        all_events: list[dict] = []

        soup = self._fetch_page(LIST_URL)
        if soup is None:
            return []

        page_events = self._parse_articles(soup, seen_urls)
        all_events.extend(page_events)
        logger.info("Страница 1: найдено %d мероприятий", len(page_events))

        # Пагинация через ?page=N (если есть)
        for page in range(2, MAX_PAGES + 1):
            next_soup = self._fetch_page(f"{LIST_URL}?page={page}")
            if next_soup is None:
                break
            new_events = self._parse_articles(next_soup, seen_urls)
            if not new_events:
                break
            all_events.extend(new_events)
            logger.info("Страница %d: найдено %d мероприятий", page, len(new_events))
            time.sleep(0.5)

        return all_events
