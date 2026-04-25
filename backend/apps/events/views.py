import json
import logging
import os

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Event
from .serializers import EventSerializer

logger = logging.getLogger(__name__)


class EventViewSet(ReadOnlyModelViewSet):
    """
    API для мероприятий/олимпиад.

    GET /api/parsed-events/                — Все мероприятия (с фильтрацией)
    GET /api/parsed-events/recommended/    — ИИ-рекомендации по future_profession
    GET /api/parsed-events/filters/        — Доступные значения фильтров
    """
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Event.objects.filter(is_active=True)

        # Фильтрация по параметрам запроса
        source = self.request.query_params.get('source')
        event_type = self.request.query_params.get('event_type')
        subject_area = self.request.query_params.get('subject_area')
        region = self.request.query_params.get('region')
        year = self.request.query_params.get('year')
        grade = self.request.query_params.get('grade')
        search = self.request.query_params.get('search')

        if source:
            queryset = queryset.filter(source=source)
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        if subject_area:
            queryset = queryset.filter(subject_area__contains=subject_area)
        if region:
            queryset = queryset.filter(region__contains=region)
        if year:
            queryset = queryset.filter(year=year)
        if grade:
            queryset = queryset.filter(grade=grade)
        if search:
            # SQLite не поддерживает icontains для кириллицы,
            # используем __contains с разными регистрами
            q = (
                Q(title__contains=search) |
                Q(title__contains=search.capitalize()) |
                Q(subject_area__contains=search) |
                Q(subject_area__contains=search.capitalize()) |
                Q(organizer__contains=search) |
                Q(organizer__contains=search.capitalize()) |
                Q(region__contains=search) |
                Q(region__contains=search.capitalize())
            )
            queryset = queryset.filter(q)

        return queryset

    @action(detail=False, methods=['get'])
    def filters(self, request):
        """Возвращает уникальные значения фильтров для фронтенда."""
        qs = Event.objects.filter(is_active=True)
        return Response({
            'sources': list(qs.values_list('source', flat=True).distinct()),
            'subject_areas': list(qs.values_list('subject_area', flat=True).distinct().order_by('subject_area')),
            'regions': list(qs.values_list('region', flat=True).distinct().order_by('region')),
            'years': list(qs.values_list('year', flat=True).distinct().order_by('-year')),
            'grades': list(qs.values_list('grade', flat=True).distinct().order_by('grade')),
        })

    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """
        ИИ-рекомендации мероприятий на основе future_profession пользователя.

        Использует sys_prompt_filter.txt для фильтрации:
        каждое мероприятие проверяется через GigaChat на соответствие
        темам интересов пользователя (определённым по future_profession).
        """
        user = request.user
        profession = getattr(user, 'future_profession', None)

        if not profession:
            return Response(
                {"detail": "Укажите желаемую профессию в настройках профиля для получения рекомендаций."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Конвертируем профессию → темы интересов для sys_prompt_filter
        user_themes = self._profession_to_themes(profession)
        logger.info("Профессия «%s» → темы: %s", profession, user_themes)

        # Берём все активные мероприятия
        events = list(Event.objects.filter(is_active=True))

        if not events:
            return Response([])

        # Пробуем ИИ-фильтрацию через sys_prompt_filter.txt
        api_key = os.getenv("API_KEY")
        if api_key:
            try:
                suitable_events = self._ai_filter_events(events, user_themes)
                serializer = EventSerializer(suitable_events, many=True)
                results = []
                for event_data in serializer.data:
                    results.append({
                        "event": event_data,
                        "reason": f"ИИ определил, что мероприятие соответствует темам: {', '.join(user_themes)}",
                        "relevance_score": 0.9,
                    })
                return Response(results)
            except Exception as exc:
                logger.warning("ИИ-фильтрация не удалась: %s. Fallback на ключевые слова.", exc)

        # Fallback: фильтрация по ключевым словам (без ИИ)
        fallback_subjects = self._profession_to_subjects(profession.lower())
        qs = Event.objects.filter(is_active=True)
        if fallback_subjects:
            q = Q()
            for subj in fallback_subjects:
                q |= Q(subject_area__contains=subj)
                q |= Q(subject_area__contains=subj.capitalize())
                q |= Q(subject_area__contains=subj.title())
            qs = qs.filter(q)

        serializer = EventSerializer(list(qs[:20]), many=True)
        results = []
        for event_data in serializer.data:
            results.append({
                "event": event_data,
                "reason": f"Предметная область «{event_data['subject_area']}» соответствует профессии «{profession}»",
                "relevance_score": 0.7,
            })

        return Response(results)

    def _profession_to_themes(self, profession: str) -> list[str]:
        """
        Конвертирует future_profession → user_themes
        в формате, ожидаемом sys_prompt_filter.txt.
        """
        PROFESSION_THEMES = {
            'программист': ['Программирование', 'Точные науки', 'IT-технологии'],
            'data scientist': ['Анализ данных', 'Программирование', 'Точные науки', 'Математика'],
            'аналитик': ['Анализ данных', 'Математика', 'Экономика'],
            'инженер': ['Инженерия', 'Точные науки', 'Физика', 'Математика'],
            'дизайнер': ['Дизайн', 'Искусство', 'Творчество'],
            'экономист': ['Экономика', 'Финансы', 'Математика'],
            'врач': ['Медицина', 'Биология', 'Химия', 'Естественные науки'],
            'юрист': ['Право', 'Обществознание', 'Гуманитарные науки'],
            'учитель': ['Педагогика', 'Образование', 'Гуманитарные науки'],
            'менеджер': ['Управление', 'Экономика', 'Бизнес'],
            'физик': ['Физика', 'Точные науки', 'Математика'],
            'математик': ['Математика', 'Точные науки'],
            'химик': ['Химия', 'Естественные науки'],
            'биолог': ['Биология', 'Экология', 'Естественные науки'],
        }

        profession_lower = profession.lower()
        for key, themes in PROFESSION_THEMES.items():
            if key in profession_lower or profession_lower in key:
                return themes

        # Если нет в маппинге — используем саму профессию как тему
        return [profession]

    def _profession_to_subjects(self, profession: str) -> list[str]:
        """Fallback-маппинг профессии → предметные области для фильтрации без ИИ."""
        SUBJECT_MAP = {
            'программист': ['информатика', 'программирование', 'математика'],
            'data scientist': ['информатика', 'математика', 'анализ данных'],
            'аналитик': ['математика', 'информатика', 'экономика'],
            'инженер': ['физика', 'математика', 'информатика'],
            'экономист': ['экономика', 'математика'],
            'врач': ['биология', 'химия'],
            'юрист': ['обществознание', 'история'],
        }

        for key, subjects in SUBJECT_MAP.items():
            if key in profession or profession in key:
                return subjects
        return [profession]

    def _ai_filter_events(self, events: list, user_themes: list[str]) -> list:
        """
        Фильтрует мероприятия через GigaChat, используя sys_prompt_filter.txt.
        Каждое мероприятие проверяется отдельно: подходит или нет.
        """
        from pathlib import Path
        from langchain_core.messages import HumanMessage, SystemMessage
        from apps.neural_network.views import _get_model

        # Загружаем системный промпт из файла
        prompt_path = Path(__file__).resolve().parent.parent / 'neural_network' / 'sys_prompt_filter.txt'
        system_prompt = prompt_path.read_text(encoding='utf-8')

        model = _get_model()
        suitable = []

        for event in events:
            # Формируем описание мероприятия для фильтра
            event_description = (
                f"{event.title} — {event.subject_area}. "
                f"{event.description} "
                f"Организатор: {event.organizer}."
            )

            # Формируем JSON-ввод как ожидает промпт
            user_input = json.dumps({
                "user_themes": user_themes,
                "event": event_description,
            }, ensure_ascii=False)

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_input),
            ]

            try:
                response = model.invoke(messages)
                response_text = getattr(response, "content", str(response)).strip()

                result = json.loads(response_text)
                if result.get("is_suitable", False):
                    suitable.append(event)
                    logger.info("✅ Подходит: %s — %s", event.title, event.subject_area)
                else:
                    logger.info("❌ Не подходит: %s — %s", event.title, event.subject_area)

            except (json.JSONDecodeError, Exception) as exc:
                logger.warning(
                    "Ошибка при фильтрации мероприятия «%s»: %s. Пропускаем.",
                    event.title, exc,
                )

        return suitable
