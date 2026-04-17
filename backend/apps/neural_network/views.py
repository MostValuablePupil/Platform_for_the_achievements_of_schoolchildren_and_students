import os
import json
import requests
from io import BytesIO
from PIL import Image

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
    proof_file_path = achievement.proof_file.path

    OCR.recognize_image(
        image_path=proof_file_path,
        lang="ru,en",
        output_dir="backend/apps/neural_network/outputs",
        save_artifacts=True
    )

    with open(f"backend/apps/neural_network/outputs/{os.path.basename(proof_file_path)}.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        extracted_text = data["res"]["rec_texts"]
    
    with open("apps/neural_network/sys_prompt_analysis.txt") as sys_prompt:
        sys_content = sys_prompt.read()

    messages = [
        SystemMessage(content=sys_content),
        HumanMessage(content=extracted_text)
    ]

    ai_response = model.invoke(messages)

    return ai_response
