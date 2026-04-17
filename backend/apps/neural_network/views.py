import os
from pathlib import Path

from django.conf import settings
from django.http import Http404
from django.shortcuts import get_object_or_404
from dotenv import load_dotenv
from langchain_gigachat import GigaChat
from langchain_core.messages import HumanMessage, SystemMessage
from portfolio.models import Achievement
import ocr_engine as OCR

load_dotenv()
api_key = os.getenv('API_KEY')

model = GigaChat(
    credentials=api_key,
    model="GigaChat-2-Lite",
    verify_ssl_certs=False,
    temperature=0.1
)

def ai_analysis(request, achievement_id):
    achievement = get_object_or_404(Achievement, id=achievement_id)
    if not achievement.proof_file:
        raise Http404("У достижения нет файла подтверждения.")

    try:
        proof_file_path = Path(achievement.proof_file.path)
    except NotImplementedError as exc:
        raise RuntimeError("Текущее хранилище файлов не поддерживает локальный путь к файлу.") from exc

    ocr_result = OCR.recognize_image(
        image_path=proof_file_path,
        lang="ru,en",
        save_artifacts=False
    )
    extracted_text = ocr_result.extracted_text
    
    sys_prompt_path = Path(settings.BASE_DIR) / "backend" / "apps" / "neural_network" / "sys_prompt_analysis.txt"
    with sys_prompt_path.open("r", encoding="utf-8") as sys_prompt:
        sys_content = sys_prompt.read()

    messages = [
        SystemMessage(content=sys_content),
        HumanMessage(content=extracted_text)
    ]

    ai_response = model.invoke(messages)

    return ai_response
