"""
Парсер олимпиад с образовательного портала postupi.online.

Источник: https://postupi.online/olimp-list/
Парсит список олимпиад для школьников с пагинацией (?page_num=N).
"""

import logging
import time

import requests
from bs4 import BeautifulSoup

from apps.events.models import Event
from apps.events.parsers import BaseSiteParser

logger = logging.getLogger(__name__)

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; AchievementPlatformBot/1.0)"}
BASE_URL = "https://postupi.online"
LIST_URL = f"{BASE_URL}/olimp-list/"
MAX_PAGES = 20


class PostupiOnlineParser(BaseSiteParser):
    """
    Парсер списка олимпиад с postupi.online.
    Страница сервер-рендерится, поддерживает пагинацию через ?page_num=N.
    """

    source = Event.Source.POSTUPI_ONLINE
    source_name = "Поступи Онлайн"

    def __init__(self, years: list[int] | None = None):
        self.years = years or [2025]

    def _fetch_page(self, page_num: int) -> BeautifulSoup | None:
        url = f"{LIST_URL}?page_num={page_num}" if page_num > 1 else LIST_URL
        try:
            response = requests.get(url, timeout=15, headers=HEADERS)
            response.raise_for_status()
        except requests.RequestException as exc:
            logger.error("Ошибка запроса %s: %s", url, exc)
            return None
        return BeautifulSoup(response.text, "lxml")

    def _parse_items(self, soup: BeautifulSoup, seen_urls: set) -> list[dict]:
        events = []

        # Каждая олимпиада — <li class="list" data-id="...">
        items = soup.find_all("li", class_="list")
        for item in items:
            try:
                # Название и ссылка
                h2 = item.find("h2", class_="list__h")
                if not h2:
                    continue
                a_tag = h2.find("a", href=True)
                if not a_tag:
                    continue
                title = a_tag.get_text(strip=True)
                href = a_tag["href"]
                # href может быть абсолютным или относительным
                if href.startswith("http"):
                    source_url = href
                else:
                    source_url = f"{BASE_URL}{href}"

                if source_url in seen_urls:
                    continue
                seen_urls.add(source_url)

                # Классы учеников — <span class="olym-fav-img__btm">
                grade_span = item.find("span", class_="olym-fav-img__btm")
                grade = grade_span.get_text(strip=True) if grade_span else ""

                # Организатор — <p class="list__pre">
                # Содержит организатора и предмет слитно: "Минпросвещения РоссииПраво"
                org_p = item.find("p", class_="list__pre")
                organizer = ""
                subject = ""
                if org_p:
                    org_text = org_p.get_text(strip=True)
                    # Организатор часто слит с предметом без разделителя.
                    # Пробуем извлечь организатора из вложенного <span data-id>
                    org_span = org_p.find("span", attrs={"data-id": True})
                    if org_span:
                        organizer = org_span.get_text(strip=True)
                        # Оставшийся текст после организатора — предмет
                        full = org_text
                        if organizer and full.startswith(organizer):
                            subject = full[len(organizer):].strip()
                    else:
                        organizer = org_text

                description = f"Организатор: {organizer}." if organizer else ""
                if subject:
                    description += f" Предмет: {subject}."
                if grade:
                    description += f" Классы: {grade}."
                if not description:
                    description = title

                events.append({
                    "title": title,
                    "description": description.strip(),
                    "event_type": Event.EventType.OLYMPIAD,
                    "source": self.source,
                    "source_url": source_url,
                    "subject_area": subject,
                    "region": "",
                    "grade": grade,
                    "year": "",
                    "organizer": organizer,
                })

            except Exception as exc:
                logger.warning("Ошибка при обработке элемента списка: %s", exc)
                continue

        return events

    def fetch_events(self) -> list[dict]:
        seen_urls: set = set()
        all_events: list[dict] = []

        for page_num in range(1, MAX_PAGES + 1):
            soup = self._fetch_page(page_num)
            if soup is None:
                break

            page_events = self._parse_items(soup, seen_urls)
            if not page_events:
                logger.info("Страница %d пустая — остановка", page_num)
                break

            all_events.extend(page_events)
            logger.info("Страница %d: найдено %d олимпиад", page_num, len(page_events))

            # Проверяем наличие следующей страницы
            next_link = soup.find("a", title="дальше")
            if not next_link:
                break

            time.sleep(0.5)

        return all_events
