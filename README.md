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

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Фронтенд будет доступен на `http://localhost:5173`, а в локальной сети на `http://192.168.0.81:5173`.

## Docker-деплой

В репозитории подготовлены:

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`
- `docker/nginx/default.conf`
- `.env.example`

### 1. Подготовь `.env`

```bash
copy .env.example .env
```

Для этой машины IP в локальной сети сейчас:

```text
192.168.0.81
```

Если IP изменится, обнови в `.env`:

- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CSRF_TRUSTED_ORIGINS`
- `CORS_ALLOWED_ORIGINS`

### 2. Запусти контейнеры

```bash
docker compose up --build -d
```

### 3. Открой проект

Приложение будет доступно по адресу:

```text
http://192.168.0.81
```

Дополнительно:

- API: `http://192.168.0.81/api/`
- Django admin: `http://192.168.0.81/admin/`

## Что делает Docker-конфигурация

- `backend` запускает Django через `gunicorn`
- `frontend` собирает React-приложение и отдаёт его через `nginx`
- `nginx` проксирует `/api` и `/admin` в Django
- `media` и `static` подключаются как volumes

## Важно

- Открой порт `80` в Windows Firewall
- Для OCR/PaddleOCR контейнер backend ставит системные зависимости
- Для первых тестов SQLite подойдёт, но для VPS лучше перейти на PostgreSQL
