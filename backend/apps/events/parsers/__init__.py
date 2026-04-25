"""
Базовый класс для парсеров сайтов олимпиад.

Каждый парсер наследуется от BaseSiteParser и реализует метод fetch_events().
"""

import logging
from abc import ABC, abstractmethod

from apps.events.models import Event

logger = logging.getLogger(__name__)


class BaseSiteParser(ABC):
    """Абстрактный базовый класс для всех парсеров."""

    source: str = ""  # Event.Source value
    source_name: str = ""  # Человекочитаемое название

    @abstractmethod
    def fetch_events(self) -> list[dict]:
        """
        Парсит сайт и возвращает список словарей,
        каждый из которых содержит поля модели Event.
        """
        ...

    def save_events(self, events: list[dict]) -> tuple[int, int]:
        """
        Сохраняет/обновляет записи в БД через update_or_create.
        Дедупликация по source_url.
        Возвращает (created_count, updated_count).
        """
        created = 0
        updated = 0

        for event_data in events:
            obj, was_created = Event.objects.update_or_create(
                source_url=event_data['source_url'],
                defaults=event_data,
            )

            if was_created:
                created += 1
            else:
                updated += 1

        return created, updated

    def run(self) -> tuple[int, int]:
        """Основной метод: парсит и сохраняет."""
        logger.info("🔍 Запуск парсера: %s", self.source_name)

        events = self.fetch_events()
        logger.info("📦 Найдено записей: %d", len(events))

        if not events:
            logger.warning("⚠️ Парсер %s не нашел записей", self.source_name)
            return 0, 0

        created, updated = self.save_events(events)
        logger.info(
            "✅ %s: создано %d, обновлено %d",
            self.source_name, created, updated,
        )

        return created, updated
