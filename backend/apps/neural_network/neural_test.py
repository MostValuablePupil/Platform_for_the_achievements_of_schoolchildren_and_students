import os
from io import BytesIO
from PIL import Image
import requests

from dotenv import load_dotenv
from langchain_gigachat import GigaChat
from langchain_core.messages import HumanMessage, SystemMessage

import easyocr

# -------------------
# ENV + MODEL
# -------------------

load_dotenv()
api_key = os.getenv('API_KEY')

model = GigaChat(
    credentials=api_key,
    model="GigaChat-2",
    verify_ssl_certs=False,
    temperature=0.2
)

# -------------------
# OCR INITIALIZATION (ВАЖНО: один раз!)
# -------------------

reader = easyocr.Reader(['ru', 'en'])

# -------------------
# IMAGE LOADING
# -------------------

def load_image(path: str):
    return Image.open(path).convert("RGB")


# -------------------
# EASYOCR FUNCTION
# -------------------

def extract_text(image: Image.Image) -> str:
    """
    OCR через EasyOCR
    """

    # PIL → numpy
    import numpy as np
    img_np = np.array(image)

    # OCR
    result = reader.readtext(
        img_np,
        detail=1,
        paragraph=True,
        contrast_ths=0.05,
        adjust_contrast=0.7,
        text_threshold=0.7,
        low_text=0.4
    )

    # сбор текста
    text = " ".join([item[1] for item in result])

    return text.strip()


# -------------------
# MAIN LOGIC
# -------------------

def ai_analysis(request, achievement_id):
    # системный промпт
    with open("apps/neural_network/sys_prompt_analysis.txt", "r", encoding="utf-8") as f:
        sys_content = f.read()

    # изображение
    image = load_image("apps/neural_network/image.png")

    # OCR
    ocr_text = extract_text(image)

    print("OCR RESULT:", ocr_text)

    if len(ocr_text) < 5:
        raise ValueError("OCR не смог извлечь текст")

    # LLM запрос
    messages = [
        SystemMessage(content=sys_content),
        HumanMessage(content=ocr_text)
    ]

    ai_response = model.invoke(messages)

    return ai_response


# -------------------
# TEST RUN
# -------------------

print(ai_analysis(None, 1))