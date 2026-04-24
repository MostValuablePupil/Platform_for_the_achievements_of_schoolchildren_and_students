import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import local

from django.conf import settings
from django.db import close_old_connections
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404
from dotenv import load_dotenv

from apps.portfolio.models import Achievement
from apps.skills.models import Skill

load_dotenv()

_thread_local = local()
_analysis_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="achievement-ai")


def _get_model():
    from langchain_gigachat import GigaChat

    model = getattr(_thread_local, "gigachat_model", None)
    if model is None:
        model = GigaChat(
            credentials=os.getenv("API_KEY"),
            model="GigaChat-2",
            verify_ssl_certs=False,
            temperature=0,
        )
        _thread_local.gigachat_model = model
    return model


def _get_system_prompt():
    sys_content = getattr(_thread_local, "analysis_sys_prompt", None)
    if sys_content is None:
        sys_prompt_path = Path(settings.BASE_DIR) / "apps" / "neural_network" / "sys_prompt_analysis.txt"
        with sys_prompt_path.open("r", encoding="utf-8") as sys_prompt:
            sys_content = sys_prompt.read()
        _thread_local.analysis_sys_prompt = sys_content
    return sys_content


def _get_local_file_path(achievement_file):
    try:
        return Path(achievement_file.file.path)
    except NotImplementedError as exc:
        raise RuntimeError(
            "Текущее хранилище файлов не поддерживает локальный путь к файлу."
        ) from exc


def _analyze_file(file_path, sys_content):
    from langchain_core.messages import HumanMessage, SystemMessage

    from . import ocr_engine as OCR

    ocr_result = OCR.recognize_image(
        image_path=file_path,
        lang="ru,en",
        save_artifacts=False,
    )
    extracted_text = ocr_result.extracted_text

    messages = [
        SystemMessage(content=sys_content),
        HumanMessage(content=extracted_text),
    ]
    ai_response = _get_model().invoke(messages)

    return extracted_text, ai_response


def _analyze_achievement_file(achievement_file, sys_content):
    file_path = _get_local_file_path(achievement_file)

    try:
        extracted_text, ai_response = _analyze_file(file_path, sys_content)
        return {
            "file_id": achievement_file.id,
            "file_name": Path(achievement_file.file.name).name,
            "file_url": achievement_file.file.url,
            "ocr_text": extracted_text,
            "response": getattr(ai_response, "content", str(ai_response)),
        }
    except Exception as exc:
        return {
            "file_id": achievement_file.id,
            "file_name": Path(achievement_file.file.name).name,
            "file_url": achievement_file.file.url,
            "error": str(exc),
        }


def build_achievement_analysis_payload(achievement, *, raise_on_missing_files=False):
    achievement_files = list(achievement.files.all().order_by("uploaded_at"))
    if not achievement_files:
        if raise_on_missing_files:
            raise FileNotFoundError("У достижения нет файлов подтверждения.")
        return {
            "achievement_id": achievement.id,
            "files_count": 0,
            "results": [],
        }

    sys_content = _get_system_prompt()
    results_by_id = {}
    max_workers = min(4, len(achievement_files))

    with ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="achievement-ocr") as executor:
        future_to_file_id = {
            executor.submit(_analyze_achievement_file, achievement_file, sys_content): achievement_file.id
            for achievement_file in achievement_files
        }

        for future in as_completed(future_to_file_id):
            result = future.result()
            results_by_id[result["file_id"]] = result

    ordered_results = [results_by_id[achievement_file.id] for achievement_file in achievement_files]

    return {
        "achievement_id": achievement.id,
        "files_count": len(ordered_results),
        "results": ordered_results,
    }


def _format_analysis_for_model(results):
    formatted_results = []

    for item in results:
        header = f"Файл: {item['file_name']}"
        if item.get("error"):
            formatted_results.append(f"{header}\nОшибка анализа: {item['error']}")
            continue

        formatted_results.append(f"{header}\n{item['response']}")

    return "\n\n".join(formatted_results)


def _extract_and_assign_skills(achievement, results):
    """
    Парсит JSON-ответы от ИИ, ищет навыки в базе и привязывает их к достижению.
    """
    found_skills = set()
    for item in results:
        if item.get("error"):
            continue
        try:
            # Извлекаем JSON из текстового ответа, если он обернут в markdown (опционально)
            # или если ответ прямо в JSON формате
            response_text = item.get("response", "").strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            data = json.loads(response_text)
            subthemes = [theme.strip().lower() for theme in data.get("subthemes", [])]
            
            # Поскольку SQLite не поддерживает case-insensitive поиск для кириллицы через __iexact,
            # ищем совпадения на уровне Python (навыков немного, это быстро)
            for skill in Skill.objects.all():
                if skill.name.lower() in subthemes:
                    found_skills.add(skill)
        except json.JSONDecodeError:
            pass # Игнорируем файлы, которые не вернули валидный JSON
        except Exception:
            pass

    if found_skills:
        achievement.skills.add(*list(found_skills))


def run_achievement_ai_analysis(achievement_id):
    close_old_connections()

    achievement = Achievement.objects.filter(pk=achievement_id).first()
    if achievement is None:
        close_old_connections()
        return None

    try:
        payload = build_achievement_analysis_payload(achievement)
        if not payload["results"]:
            close_old_connections()
            return payload

        Achievement.objects.filter(pk=achievement_id).update(
            ai_analysis_result=_format_analysis_for_model(payload["results"])
        )
        
        # Обновляем инстанс achievement перед привязкой
        achievement.refresh_from_db()
        _extract_and_assign_skills(achievement, payload["results"])
        
        close_old_connections()
        return payload
    except Exception as exc:
        error_message = f"Ошибка AI-анализа: {exc}"
        Achievement.objects.filter(pk=achievement_id).update(ai_analysis_result=error_message)
        close_old_connections()
        return {
            "achievement_id": achievement_id,
            "files_count": 0,
            "results": [],
            "error": error_message,
        }


def enqueue_achievement_ai_analysis(achievement_id):
    return _analysis_executor.submit(run_achievement_ai_analysis, achievement_id)


def ai_analysis(request, achievement_id):
    achievement = get_object_or_404(Achievement, id=achievement_id)

    try:
        payload = build_achievement_analysis_payload(achievement, raise_on_missing_files=True)
    except FileNotFoundError as exc:
        raise Http404(str(exc)) from exc

    Achievement.objects.filter(pk=achievement.id).update(
        ai_analysis_result=_format_analysis_for_model(payload["results"])
    )
    
    achievement.refresh_from_db()
    _extract_and_assign_skills(achievement, payload["results"])

    return JsonResponse(
        payload,
        json_dumps_params={"ensure_ascii": False},
    )


def ai_filter(request):
    pass
