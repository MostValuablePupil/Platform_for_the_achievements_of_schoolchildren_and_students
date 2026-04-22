import os
from pathlib import Path

from django.conf import settings
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_gigachat import GigaChat

import ocr_engine as OCR
from apps.portfolio.models import Achievement

load_dotenv()
api_key = os.getenv("API_KEY")

model = GigaChat(
    credentials=api_key,
    model="GigaChat-2-Lite",
    verify_ssl_certs=False,
    temperature=0.1,
)


def _get_local_file_path(achievement_file):
    try:
        return Path(achievement_file.file.path)
    except NotImplementedError as exc:
        raise RuntimeError(
            "Текущее хранилище файлов не поддерживает локальный путь к файлу."
        ) from exc


def _analyze_file(file_path, sys_content):
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
    ai_response = model.invoke(messages)

    return extracted_text, ai_response


def ai_analysis(request, achievement_id):
    achievement = get_object_or_404(Achievement, id=achievement_id)
    achievement_files = achievement.files.all().order_by("uploaded_at")
    if not achievement_files.exists():
        raise Http404("У достижения нет файлов подтверждения.")

    sys_prompt_path = (
        Path(settings.BASE_DIR)
        / "backend"
        / "apps"
        / "neural_network"
        / "sys_prompt_analysis.txt"
    )
    with sys_prompt_path.open("r", encoding="utf-8") as sys_prompt:
        sys_content = sys_prompt.read()

    results = []
    for achievement_file in achievement_files:
        file_path = _get_local_file_path(achievement_file)

        try:
            extracted_text, ai_response = _analyze_file(file_path, sys_content)
            results.append(
                {
                    "file_id": achievement_file.id,
                    "file_name": Path(achievement_file.file.name).name,
                    "file_url": achievement_file.file.url,
                    "ocr_text": extracted_text,
                    "response": getattr(ai_response, "content", str(ai_response)),
                }
            )
        except Exception as exc:
            results.append(
                {
                    "file_id": achievement_file.id,
                    "file_name": Path(achievement_file.file.name).name,
                    "file_url": achievement_file.file.url,
                    "error": str(exc),
                }
            )

    return JsonResponse(
        {
            "achievement_id": achievement.id,
            "files_count": len(results),
            "results": results,
        },
        json_dumps_params={"ensure_ascii": False},
    )

def ai_filter(request):
    pass

print(ai_analysis(None, 1))