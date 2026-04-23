# Most Valuable Pupil (MVP)

Платформа цифрового портфолио студентов и поиска талантов для работодателей.

## Что нужно для запуска

Для локальной разработки:

1. Python 3.10+
2. Node.js 18+
3. Git

Для Docker-деплоя:

1. Docker
2. Docker Compose

## Локальный запуск

Открой два терминала: один для backend, второй для frontend.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Создай файл `.env` в папке `backend/` и добавь туда сгенерированный SECRET_KEY (а также ключи для нейросети, если есть):
```env
# Django Secret Key
SECRET_KEY=вставь_сюда_сгенерированный_ключ
API_KEY=вставь_сюда_ключ_от_gigachat
```

*(Сгенерировать ключ можно командой: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)*

#### Настройка Фронтенда
Установи зависимости Node.js:
```bash
cd ../frontend
npm install
cd ..
```

### 3. Запуск проекта (в один клик)

Для удобного запуска всего проекта разом используйте скрипт `start.sh` в корне проекта.

Сделайте скрипт исполняемым (только первый раз):
```bash
chmod +x start.sh
```

**Запустите проект:**
```bash
./start.sh
```

✅ Бэкенд будет доступен по адресу: http://127.0.0.1:8000
✅ Фронтенд будет доступен по адресу: http://localhost:5173 

Для остановки серверов просто нажмите `Ctrl+C`.
