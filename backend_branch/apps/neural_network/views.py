import os
import requests
from io import BytesIO
from PIL import Image
import pytesseract

from django.shortcuts import get_object_or_404
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

    img_link = achievement.proof_link

    extracted_text = None

    if img_link:
        try:
            response = requests.get(img_link, timeout=10)
            response.raise_for_status()

            # 👉 Открываем изображение
            image = Image.open(BytesIO(response.content))
            image = image.convert('L')  # grayscale для лучшего распознавания текста

            # 👉 OCR
            extracted_text = pytesseract.image_to_string(
                image,
                lang='rus+eng'  # важно для русского текста
            )

        except requests.exceptions.RequestException as e:
            print(f"Ошибка загрузки изображения: {e}")
        except Exception as e:
            print(f"OCR ошибка: {e}")

    if not extracted_text:
        raise ValueError("Не удалось извлечь текст из изображения")

    # Читаем системный промпт
    with open("apps/neural_network/sys_prompt_analysis.txt") as sys_prompt:
        sys_content = sys_prompt.read()

    extracted_text = extracted_text.strip()

    if len(extracted_text) < 10:
        raise ValueError("Слишком мало текста — OCR, вероятно, не сработал")
    
    # 👉 Теперь отправляем ТЕКСТ, а не картинку
    messages = [
        SystemMessage(content=sys_content),
        HumanMessage(content=extracted_text)
    ]

    ai_response = model.invoke(messages)

    return ai_response