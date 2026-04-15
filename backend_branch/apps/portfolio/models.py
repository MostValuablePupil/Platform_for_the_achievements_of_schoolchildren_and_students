from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.skills.models import Skill


class Event(models.Model):
    title = models.CharField(max_length=200, verbose_name="Название мероприятия")
    description = models.TextField(verbose_name="Описание")
    date = models.DateTimeField(verbose_name="Дата проведения")
    created = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    skills = models.ManyToManyField('skills.Skill', verbose_name="Прокачиваемые навыки")
    
    class Meta:
        verbose_name = "Мероприятие"
        verbose_name_plural = "Мероприятия"

    def __str__(self):
        return self.title


class Achievement(models.Model):
    """
    Достижения (заявки на верификацию)
    """
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Черновик'
        PENDING = 'PENDING', 'На проверке'
        VERIFIED = 'VERIFIED', 'Подтверждено'
        REJECTED = 'REJECTED', 'Отклонено'

    # ===== ТИПЫ ДОСТИЖЕНИЙ (из таблицы) =====
    class EventTypeChoices(models.TextChoices):
        OLYMPIAD = 'OLYMPIAD', '🧠 Олимпиада'
        HACKATHON = 'HACKATHON', '💻 Проект / Хакатон'
        COURSE = 'COURSE', '📚 Курс / Обучение'
        VOLUNTEERING = 'VOLUNTEERING', '🤝 Волонтерство'
        SCIENCE = 'SCIENCE', '🔬 Научная работа'
        SPORT_ART = 'SPORT_ART', '🏅 Спорт / Творчество'

    # ===== УРОВНИ ДЛЯ ОЛИМПИАД =====
    class OlympiadLevels(models.TextChoices):
        UNIVERSITY = 'UNIVERSITY', 'Вузовская'
        REGIONAL = 'REGIONAL', 'Региональная'
        ALL_RUSSIA = 'ALL_RUSSIA', 'Всероссийская'

    # ===== УРОВНИ ДЛЯ ХАКАТОНОВ/ПРОЕКТОВ =====
    class HackathonLevels(models.TextChoices):
        INTERNAL = 'INTERNAL', 'Внутривузовский'
        INTER_UNIVERSITY = 'INTER_UNIVERSITY', 'Межвузовский'

    # ===== УРОВНИ ДЛЯ КУРСОВ =====
    class CourseLevels(models.TextChoices):
        ONLINE_SHORT = 'ONLINE_SHORT', 'Онлайн-курс (до 20 ч)'
        RETRAINING = 'RETRAINING', 'Профессиональная переподготовка'

    # ===== УРОВНИ ДЛЯ ВОЛОНТЕРСТВА =====
    class VolunteerLevels(models.TextChoices):
        SHORT = 'SHORT', '1-10 часов'
        LONG = 'LONG', '10+ часов'

    # ===== УРОВНИ ДЛЯ НАУЧНОЙ РАБОТЫ =====
    class ScienceLevels(models.TextChoices):
        ARTICLE = 'ARTICLE', 'Статья в сборнике'
        VAK = 'VAK', 'Публикация в журнале ВАК'

    # ===== УРОВНИ ДЛЯ СПОРТА/ТВОРЧЕСТВА =====
    class SportLevels(models.TextChoices):
        EVENT = 'EVENT', 'Участие в мероприятии'

    # ===== РЕЗУЛЬТАТЫ (для олимпиад, хакатонов, науки, спорта) =====
    class AchievementLevel(models.TextChoices):
        PARTICIPANT = 'PARTICIPANT', 'Участие'
        PRIZE = 'PRIZE', 'Призёр'
        WINNER = 'WINNER', 'Победитель'

    # ===== ПОЛЯ МОДЕЛИ =====
    
    # Тип достижения
    event_type = models.CharField(
        max_length=20,
        choices=EventTypeChoices.choices,
        verbose_name="Тип достижения"
    )

    # Уровень/категория (зависит от типа)
    level_category = models.CharField(
        max_length=30,
        verbose_name="Уровень/Категория",
        help_text="Выберите уровень в зависимости от типа достижения"
    )
    
    # Результат (для олимпиад, хакатонов, науки, спорта)
    achievement_level = models.CharField(
        max_length=20,
        choices=AchievementLevel.choices,
        default='PARTICIPANT',
        verbose_name="Результат",
        blank=True
    )
    
    # Основные поля
    title = models.CharField(
        max_length=255, 
        verbose_name="Название достижения"
    )
    description = models.TextField(
        blank=True, 
        verbose_name="Описание"
    )
    
    # Организация и ссылка
    organization = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Организация/Учреждение"
    )
    link = models.URLField(
        blank=True,
        verbose_name="Ссылка"
    )
    
    # Файл подтверждения
    proof_file = models.FileField(
        upload_to='proofs/%Y/%m/', 
        blank=True, 
        null=True, 
        verbose_name="Файл подтверждения"
    )
    
    # Количество часов (для волонтёрства)
    hours_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Количество часов",
        help_text="Для волонтёрства укажите количество часов"
    )
    
    # Есть сертификат/диплом (для курсов)
    has_certificate = models.BooleanField(
        default=False,
        verbose_name="Есть сертификат/диплом",
        help_text="Отметьте, если есть сертификат или диплом"
    )
    
    # Связи с пользователями
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='achievements',
        verbose_name="Студент"
    )
    verifier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_achievements',
        verbose_name="Проверяющий (Куратор)"
    )
    
    # Навыки
    skills = models.ManyToManyField(
        Skill, 
        related_name='achievements',
        verbose_name="Подтверждаемые навыки",
        blank=True
    )
    
    # Баллы XP
    points = models.PositiveIntegerField(
        default=0, 
        verbose_name="Баллы за достижение (XP)"
    )
    
    # Статус
    status = models.CharField(
        max_length=10, 
        choices=Status.choices, 
        default=Status.PENDING,
        verbose_name="Статус верификации"
    )
    
    # Начислен ли опыт
    is_rewarded = models.BooleanField(
        default=False, 
        verbose_name="Опыт начислен"
    )
    
    # Дата подтверждения
    verified_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Дата и время подтверждения"
    )
    
    # Дата создания
    created = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )

    # ===== МЕТОДЫ =====
    
    def calculate_xp(self):
        """
        Расчёт XP по таблице из ТЗ
        """
        # Таблица XP из вашего ТЗ
        xp_table = {
            # 🧠 ОЛИМПИАДЫ
            'OLYMPIAD': {
                'UNIVERSITY': {'PARTICIPANT': 50, 'PRIZE': 150, 'WINNER': 300},
                'REGIONAL': {'PARTICIPANT': 100, 'PRIZE': 250, 'WINNER': 500},
                'ALL_RUSSIA': {'PARTICIPANT': 200, 'PRIZE': 500, 'WINNER': 1000},
            },
            # 💻 ХАКАТОНЫ/ПРОЕКТЫ
            'HACKATHON': {
                'INTERNAL': {'PARTICIPANT': 80, 'PRIZE': 200, 'WINNER': 400},
                'INTER_UNIVERSITY': {'PARTICIPANT': 150, 'PRIZE': 350, 'WINNER': 700},
            },
            # 📚 КУРСЫ
            'COURSE': {
                'ONLINE_SHORT': {'BASE': 100, 'CERTIFICATE_BONUS': 50},
                'RETRAINING': {'BASE': 300, 'CERTIFICATE_BONUS': 100},
            },
            # 🤝 ВОЛОНТЕРСТВО
            'VOLUNTEERING': {
                'SHORT': {'XP_PER_HOUR': 30, 'BONUS': 50},
                'LONG': {'XP_PER_HOUR': 40, 'BADGE': 'Добро'},
            },
            # 🔬 НАУЧНАЯ РАБОТА
            'SCIENCE': {
                'ARTICLE': {'PARTICIPANT': 150, 'WINNER': 300},
                'VAK': {'PARTICIPANT': 400, 'WINNER': 800},
            },
            # 🏅 СПОРТ/ТВОРЧЕСТВО
            'SPORT_ART': {
                'EVENT': {'PARTICIPANT': 40, 'PRIZE': 100, 'WINNER': 250},
            },
        }
        
        table = xp_table.get(self.event_type, {})
        level_data = table.get(self.level_category, {})
        
        # Для курсов
        if self.event_type == 'COURSE':
            base = level_data.get('BASE', 0)
            if self.has_certificate:
                base += level_data.get('CERTIFICATE_BONUS', 0)
            return base
        
        # Для волонтёрства
        if self.event_type == 'VOLUNTEERING':
            xp_per_hour = level_data.get('XP_PER_HOUR', 0)
            hours = self.hours_count or 1
            xp = xp_per_hour * hours
            
            # Бонус для 1-10 часов
            if self.level_category == 'SHORT':
                xp += level_data.get('BONUS', 0)
            
            return xp
        
        # Для остальных типов (олимпиады, хакатоны, наука, спорт)
        return level_data.get(self.achievement_level, 0)

    def save(self, *args, **kwargs):
        """Автоматический расчёт XP при сохранении"""
        # Расчитываем XP
        self.points = self.calculate_xp()
        
        # Дата подтверждения
        if self.status == 'VERIFIED' and not self.verified_at:
            self.verified_at = timezone.now()
        elif self.status != 'VERIFIED' and self.verified_at:
            self.verified_at = None
            
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Достижение"
        verbose_name_plural = "Достижения"
        ordering = ['-created']

    def __str__(self):
        return f"{self.title} ({self.get_event_type_display()})"


class Badge(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Название бейджа")
    description = models.TextField(verbose_name="Описание (за что дается)")
    icon = models.ImageField(upload_to='badges/', verbose_name="Иконка бейджа")

    class Meta:
        verbose_name = "Бейдж"
        verbose_name_plural = "Бейджи"

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='badges',
        verbose_name="Студент"
    )
    badge = models.ForeignKey(
        Badge, 
        on_delete=models.CASCADE, 
        verbose_name="Бейдж"
    )
    earned_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата получения")

    class Meta:
        verbose_name = "Бейдж пользователя"
        verbose_name_plural = "Бейджи пользователей"
        unique_together = ('user', 'badge')

    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"
from apps.skills.models import Skill

class Event(models.Model):
    title = models.CharField(max_length=200, verbose_name="Название мероприятия")
    description = models.TextField(verbose_name="Описание")
    date = models.DateTimeField(verbose_name="Дата проведения")
    
    # Ключевое поле для ИИ и поиска! Какие навыки прокачает это мероприятие?
    skills = models.ManyToManyField('skills.Skill', verbose_name="Прокачиваемые навыки")
    
    class Meta:
        verbose_name = "Мероприятие"
        verbose_name_plural = "Мероприятия"

    def __str__(self):
        return self.title


class Achievement(models.Model):
    """
    Достижения (заявки на верификацию)
    """
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Черновик'
        PENDING = 'PENDING', 'На проверке'
        VERIFIED = 'VERIFIED', 'Подтверждено'
        REJECTED = 'REJECTED', 'Отклонено'

    class EventTypeChoices(models.TextChoices):
        VOLUNTEERING = 'VOLUNTEERING', 'Волонтерство'
        HACKATHON = 'HACKATHON', 'Хакатон'
        COURSE = 'COURSE', 'Пройденный курс'
        OLYMPIAD = 'OLYMPIAD', 'Олимпиада'
        PUBLICATION = 'PUBLICATION', 'Научная публикация'
        TEAM_PROJECT = 'TEAM_PROJECT', 'Командный проект'
        MENTORSHIP = 'MENTORSHIP', 'Наставничество'
        OTHER = 'OTHER', 'Другое'

    # Новое поле для выбора типа
    event_type = models.CharField(
        max_length=20,
        choices=EventTypeChoices.choices,
        default=EventTypeChoices.HACKATHON,
        verbose_name="Тип мероприятия"
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='achievements',
        verbose_name="Студент"
    )
    verifier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_achievements',
        verbose_name="Проверяющий (Куратор)"
    )
    
    # ... твои поля статуса и т.д.
    is_rewarded = models.BooleanField(
        default=False, 
        verbose_name="Опыт начислен"
    )
    title = models.CharField(max_length=255, verbose_name="Название достижения")
    description = models.TextField(blank=True, verbose_name="Описание")
    
    proof_file = models.FileField(
        upload_to='proofs/%Y/%m/', 
        blank=True, 
        null=True, 
        verbose_name="Файл подтверждения"
    )    
    points = models.PositiveIntegerField(default=10, verbose_name="Баллы за достижение")
    
    status = models.CharField(
        max_length=10, 
        choices=Status.choices, 
        default=Status.PENDING, # По умолчанию сразу отправляем на проверку
        verbose_name="Статус верификации"
    )
    
    skills = models.ManyToManyField(
        Skill, 
        related_name='achievements',
        verbose_name="Подтверждаемые навыки"
    )

    # Время подтверждения (может быть пустым, пока не подтвердят)
    verified_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Дата и время подтверждения"
    )

    # МАГИЯ DJANGO: Перехватываем момент сохранения в базу
    def save(self, *args, **kwargs):
        # Если статус стал VERIFIED, а даты еще нет — ставим текущее время
        if self.status == 'VERIFIED' and not self.verified_at:
            self.verified_at = timezone.now()
        
        # Защита от ошибок: если куратор передумал и вернул статус на PENDING (На проверке),
        # мы стираем дату подтверждения, чтобы всё было честно.
        elif self.status != 'VERIFIED' and self.verified_at:
            self.verified_at = None
            
        # Вызываем стандартное сохранение
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Достижение"
        verbose_name_plural = "Достижения"

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class Badge(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Название бейджа")
    description = models.TextField(verbose_name="Описание (за что дается)")
    icon = models.ImageField(upload_to='badges/', verbose_name="Иконка бейджа")

    class Meta:
        verbose_name = "Бейдж"
        verbose_name_plural = "Бейджи"

    def __str__(self):
        return self.name

class UserBadge(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='badges', # Позволит брать бейджи юзера: user.badges.all()
        verbose_name="Студент"
    )
    badge = models.ForeignKey(
        Badge, 
        on_delete=models.CASCADE, 
        verbose_name="Бейдж"
    )
    earned_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата получения")

    class Meta:
        verbose_name = "Бейдж пользователя"
        verbose_name_plural = "Бейджи пользователей"
        # Защита: один и тот же бейдж нельзя получить дважды
        unique_together = ('user', 'badge') 

    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"
