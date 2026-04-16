FROM python:3.11-slim

# 1. Устанавливаем Tesseract + языки
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-rus \
    tesseract-ocr-eng \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# 2. Рабочая папка
WORKDIR /app

# 3. Установка зависимостей Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Копируем проект
COPY . .

# 5. Запуск Django
#CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]