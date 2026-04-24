from django.db import models


class Event(models.Model):
    """
    Спарсенное мероприятие/олимпиада с внешнего сайта.
    Хранит информацию о самом мероприятии, а не об участниках.
    """

    class Source(models.TextChoices):
        """Откуда спарсено мероприятие (с какого сайта)."""
        URFU_IZUMRUD = 'URFU_IZUMRUD', 'УрФУ «Изумруд»'
        URFU_VUZAKADEM = 'URFU_VUZAKADEM', 'УрФУ Вузовско-академическая'
        MIPT = 'MIPT', 'МФТИ'
        BMSTU = 'BMSTU', 'МГТУ им. Баумана'
        ITMO = 'ITMO', 'ИТМО'
        VSOSH = 'VSOSH', 'ВСОШ'
        MANUAL = 'MANUAL', 'Добавлено вручную'

    class EventType(models.TextChoices):
        OLYMPIAD = 'OLYMPIAD', 'Олимпиада'
        HACKATHON = 'HACKATHON', 'Хакатон'
        COMPETITION = 'COMPETITION', 'Конкурс'
        CONFERENCE = 'CONFERENCE', 'Конференция'
        GRANT = 'GRANT', 'Грант'

    # === Основная информация ===
    title = models.CharField(
        max_length=500,
        verbose_name="Название мероприятия",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Описание",
    )
    event_type = models.CharField(
        max_length=20,
        choices=EventType.choices,
        default=EventType.OLYMPIAD,
        verbose_name="Тип мероприятия",
    )

    # === Источник ===
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        verbose_name="Источник (с какого сайта спарсено)",
    )
    source_url = models.URLField(
        max_length=1000,
        unique=True,
        verbose_name="URL на источнике",
        help_text="Ссылка на страницу мероприятия (используется для дедупликации)",
    )

    # === Предметная область ===
    subject_area = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Предметная область / Профиль",
        help_text="Например: Информатика, Математика, Физика",
    )

    # === Фильтрация ===
    region = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Регион / Город проведения",
    )
    grade = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Для какого класса / курса",
    )
    year = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Учебный год",
        help_text="Например: 2025/26",
    )

    # === Организатор ===
    organizer = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="Организатор",
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name="Активно",
    )

    parsed_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата парсинга",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления",
    )

    class Meta:
        verbose_name = "Мероприятие"
        verbose_name_plural = "Мероприятия"
        ordering = ['-parsed_at']

    def __str__(self):
        return f"{self.title} — {self.subject_area} ({self.year})"
