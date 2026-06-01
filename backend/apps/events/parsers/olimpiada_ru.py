"""
Парсер олимпиад с сайта olimpiada.ru.

Источник: https://olimpiada.ru/activities
Парсит текущий список активных олимпиад с предметами и классами участников.
"""

import logging
import time

import requests
from bs4 import BeautifulSoup

from apps.events.models import Event
from apps.events.parsers import BaseSiteParser

logger = logging.getLogger(__name__)

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; AchievementPlatformBot/1.0)"}
BASE_URL = "https://olimpiada.ru"
ACTIVITIES_URL = f"{BASE_URL}/activities"
MAX_PAGES = 20


class OlimpiadaRuParser(BaseSiteParser):
    """
    Парсер главного российского агрегатора олимпиад olimpiada.ru.
    Список активных олимпиад доступен без пагинации на одной странице.
    """

    source = Event.Source.OLIMPIADA_RU
    source_name = "Олимпиада.ру"

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

    def fetch_events(self) -> list[dict]:
        events = []
        seen_urls = set()

        soup = self._fetch_page(ACTIVITIES_URL)
        if soup is None:
            return []

        # Карточки имеют класс .olimpiada; атрибут act= хранит ID олимпиады
        cards = soup.find_all("div", class_="olimpiada")
        logger.info("Найдено карточек: %d", len(cards))

        for card in cards:
            try:
                act_id = card.get("act", "")
                if not act_id:
                    continue

                # Заголовок
                a_tag = card.find("a", class_="none_a")
                if not a_tag:
                    continue
                headline = a_tag.find("span", class_="headline")
                if not headline:
                    continue
                title = headline.get_text(strip=True)
                href = a_tag.get("href", "")
                if not href:
                    continue
                source_url = f"{BASE_URL}{href}"
                if source_url in seen_urls:
                    continue
                seen_urls.add(source_url)

                # Предмет
                subject_tag = card.find("span", class_="subject_tag")
                subject = subject_tag.get_text(strip=True) if subject_tag else ""
                # Убираем иконку (icon-xxx) — оставляем только текст через Unicode
                subject = " ".join(
                    part for part in subject.split() if not part.startswith("icon-")
                )

                # Классы участников
                classes_span = card.find("span", class_="classes_dop")
                grade = classes_span.get_text(strip=True) if classes_span else ""

                description = f"Олимпиада по предмету «{subject}»." if subject else title
                if grade:
                    description += f" Классы: {grade}."

                events.append({
                    "title": title,
                    "description": description,
                    "event_type": Event.EventType.OLYMPIAD,
                    "source": self.source,
                    "source_url": source_url,
                    "subject_area": subject,
                    "region": "",
                    "grade": grade,
                    "year": "",
                    "organizer": "",
                })

            except Exception as exc:
                logger.warning("Ошибка при обработке карточки: %s", exc)
                continue

        # Пагинация — если появится «Ещё» ссылки на следующие страницы, парсим их
        page = 2
        while page <= MAX_PAGES:
            next_soup = self._fetch_page(f"{ACTIVITIES_URL}?page={page}")
            if next_soup is None:
                break
            new_cards = next_soup.find_all("div", class_="olimpiada")
            if not new_cards:
                break
            added = 0
            for card in new_cards:
                try:
                    act_id = card.get("act", "")
                    if not act_id:
                        continue
                    a_tag = card.find("a", class_="none_a")
                    if not a_tag:
                        continue
                    headline = a_tag.find("span", class_="headline")
                    if not headline:
                        continue
                    title = headline.get_text(strip=True)
                    href = a_tag.get("href", "")
                    if not href:
                        continue
                    source_url = f"{BASE_URL}{href}"
                    if source_url in seen_urls:
                        continue
                    seen_urls.add(source_url)

                    subject_tag = card.find("span", class_="subject_tag")
                    subject = subject_tag.get_text(strip=True) if subject_tag else ""
                    subject = " ".join(
                        p for p in subject.split() if not p.startswith("icon-")
                    )
                    classes_span = card.find("span", class_="classes_dop")
                    grade = classes_span.get_text(strip=True) if classes_span else ""
                    description = f"Олимпиада по предмету «{subject}»." if subject else title
                    if grade:
                        description += f" Классы: {grade}."

                    events.append({
                        "title": title,
                        "description": description,
                        "event_type": Event.EventType.OLYMPIAD,
                        "source": self.source,
                        "source_url": source_url,
                        "subject_area": subject,
                        "region": "",
                        "grade": grade,
                        "year": "",
                        "organizer": "",
                    })
                    added += 1
                except Exception as exc:
                    logger.warning("Ошибка при обработке карточки (стр. %d): %s", page, exc)
                    continue
            if added == 0:
                break
            page += 1
            time.sleep(0.5)

        return events
