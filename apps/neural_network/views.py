import os
import base64
import requests
from django.shortcuts import render, get_object_or_404
from dotenv import load_dotenv
from langchain_gigachat import GigaChat
from langchain_core.messages import HumanMessage, SystemMessage
from apps.portfolio.models import Achievement

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
    
    image_data_url = None
    
    # Предположим, поле со ссылкой называется 'image_url'
    img_link = achievement.proof_link 
    
    # Если ссылка есть, скачиваем картинку по сети
    if img_link:
        try:
            # Делаем GET-запрос по ссылке с таймаутом, чтобы сервер не завис, если картинка недоступна
            response = requests.get(img_link, timeout=10)
            response.raise_for_status() # Бросит ошибку, если ссылка вернет 404 или 500
            
            # Берем байты из ответа (response.content) и кодируем в base64
            encoded_string = base64.b64encode(response.content).decode('utf-8')
            
            # Формируем Data-URI
            image_data_url = f"data:image/jpeg;base64,{encoded_string}"
            
        except requests.exceptions.RequestException as e:
            # Обрабатываем ситуацию, когда картинка по ссылке недоступна
            print(f"Не удалось скачать картинку по ссылке: {e}")

    # Читаем системный промпт
    with open("apps/neural_network/sys_prompt_analysis.txt") as sys_prompt:
        sys_content = sys_prompt.read()

    # Формируем контент
    if image_data_url:
        human_content = [
            {"type": "text", "text": ""},
            {"type": "image_url", "image_url": {"url": image_data_url}}
        ]
    else:
        raise FileNotFoundError

    messages = [
        SystemMessage(content=sys_content),
        HumanMessage(content=human_content)
    ]
    
    # Отправляем запрос в модель
    ai_response = model.invoke(messages)
    return ai_response

def ai_filter(request):
    pass