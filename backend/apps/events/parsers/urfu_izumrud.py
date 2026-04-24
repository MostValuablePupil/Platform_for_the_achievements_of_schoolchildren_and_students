"""
Парсер мероприятий олимпиады УрФУ «Изумруд».

Источник: https://dovuz.urfu.ru/olymps/izumrud/final-results
Парсит страницу и извлекает уникальные профили (предметы) олимпиады
за каждый учебный год, создавая одну запись Event на каждый профиль.
"""

import logging
import time

import requests
from bs4 import BeautifulSoup

from apps.events.models import Event
from apps.events.parsers import BaseSiteParser

logger = logging.getLogger(__name__)


class UrfuIzumrudParser(BaseSiteParser):
    source = Event.Source.URFU_IZUMRUD
    source_name = "УрФУ «Изумруд»"

    BASE_URL = "https://dovuz.urfu.ru/olymps/izumrud/final-results"
    ABOUT_URL = "https://dovuz.urfu.ru/olymps/izumrud"
    ORGANIZER = "Уральский федеральный университет (УрФУ)"
    TITLE = "Международная олимпиада «Изумруд»"

    def __init__(self, years: list[int] | None = None):
        """
        :param years: Список учебных годов для парсинга.
                      Например: [2025] → парсит 2025/26 учебный год.
                      По умолчанию — только текущий (2025).
        """
        self.years = years or [2025]

    def _parse_page(self, year: int, page: int) -> tuple[set[str], set[str], bool]:
        """
        Парсит одну страницу и извлекает уникальные профили (предметы)
        и классы.
        
        Возвращает (profiles_set, grades_set, has_next_page).
        """
        params = {"year": year, "page": page, "per-page": 25}
        
        try:
            response = requests.get(
                self.BASE_URL,
                params=params,
                timeout=15,
                headers={"User-Agent": "Mozilla/5.0 (compatible; AchievementPlatformBot/1.0)"},
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            logger.error("Ошибка запроса %s: %s", self.BASE_URL, exc)
            return set(), set(), False

        soup = BeautifulSoup(response.text, "lxml")

        # Ищем таблицу с результатами (Yii2 GridView)
        table = soup.select_one(".grid-view table")
        if not table:
            logger.warning("Таблица не найдена на странице %d (год %d)", page, year)
            return set(), set(), False

        tbody = table.select_one("tbody")
        if not tbody:
            return set(), set(), False

        rows = tbody.select("tr")
        profiles = set()
        grades = set()

        for row in rows:
            cells = row.select("td")
            if len(cells) < 9:
                continue

            profile = cells[4].get_text(strip=True)
            grade = cells[5].get_text(strip=True)

            if profile:
                profiles.add(profile)
            if grade:
                grades.add(grade)

        # Проверяем наличие следующей страницы
        pagination = soup.select("a.u-pagination-v1__item")
        has_next = False
        for link in pagination:
            href = link.get("href", "")
            if f"page={page + 1}" in href:
                has_next = True
                break

        return profiles, grades, has_next

    def fetch_events(self) -> list[dict]:
        """
        Парсит все страницы за указанные годы и формирует
        список уникальных мероприятий (одна запись на профиль × год).
        """
        all_events = []

        for year in self.years:
            year_str = f"{year}/{year + 1 - 2000}"  # 2025 → "2025/26"
            logger.info("📅 Парсинг за %s учебный год...", year_str)

            all_profiles = set()
            all_grades = set()
            page = 1

            while True:
                logger.info("  📄 Страница %d...", page)
                profiles, grades, has_next = self._parse_page(year, page)

                all_profiles.update(profiles)
                all_grades.update(grades)

                if not has_next or (not profiles and not grades):
                    break

                page += 1
                # Вежливая пауза между запросами
                time.sleep(0.5)

            logger.info(
                "  📋 Найдено профилей: %d (%s)",
                len(all_profiles), ", ".join(sorted(all_profiles)),
            )

            # Создаём одну запись Event на каждый профиль
            grades_str = ", ".join(sorted(all_grades))
            for profile in sorted(all_profiles):
                all_events.append({
                    "title": self.TITLE,
                    "description": (
                        f"Олимпиада по профилю «{profile}» за {year_str} учебный год. "
                        f"Классы: {grades_str}."
                    ),
                    "event_type": Event.EventType.OLYMPIAD,
                    "source": self.source,
                    "source_url": f"{self.BASE_URL}?year={year}&subject={profile}",
                    "subject_area": profile,
                    "region": "Екатеринбург",
                    "grade": grades_str,
                    "year": year_str,
                    "organizer": self.ORGANIZER,
                })

        return all_events
