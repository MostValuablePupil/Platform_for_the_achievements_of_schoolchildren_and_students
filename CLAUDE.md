# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Most Valuable Pupil (MVP)** — платформа цифрового портфолио для школьников и студентов. Студенты добавляют достижения, кураторы их подтверждают, работодатели просматривают профили.

## Commands

### Quick start (both backend + frontend)
```bash
./start.sh
```

### Backend
```bash
cd backend
source ../.venv/bin/activate   # или venv/bin/activate если локальный venv
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

First-time setup — load fixtures in this order:
```bash
python manage.py loaddata fixtures/specialties_fixture.json
python manage.py loaddata fixtures/skills_fixture.json
python manage.py loaddata fixtures/badges_fixture.json
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # dev server на http://localhost:5173
npm run build     # production build
npm run lint      # ESLint
```

### Docker (production)
```bash
docker compose up --build
# Frontend: http://localhost:80
```

## Architecture

### Backend (`backend/`)

Django 4.2 + DRF. Кастомная модель пользователя `apps.users.User` (AbstractUser).

**Приложения:**
- `users` — регистрация, логин, email-верификация, профиль, экспорт CSV
- `portfolio` — достижения (`Achievement`) и их верификация кураторами
- `skills` — навыки, категории, профили навыков, прогресс пользователя
- `events` — парсинг олимпиад и мероприятий с внешних сайтов (УрФУ и др.)
- `gamification` — бейджи, XP, уровни (интегрировано с portfolio)
- `neural_network` — GigaChat (LangChain) + PaddleOCR для анализа документов
- `vacancy` — вакансии работодателей
- `telegram_bot` — Telegram-интеграция

**API роутинг** (`Platform/urls.py`):
- `DefaultRouter` регистрирует: `users`, `achievements`, `events`, `parsed-events`, `skills`, `skill-categories`, `profiles`, `specialties`
- Кастомные endpoints: `api/login/`, `api/users/verify-email/<token>/`, `api/users/resend-verification/`
- Swagger: `api/docs/`

**Аутентификация:** Token-based (`rest_framework.authtoken`). При регистрации `is_active=False` до подтверждения email. Токен верификации через `django.core.signing`.

**Email:** настраивается через `.env`. В разработке — `console.EmailBackend` (письма в терминал). HTML-шаблон письма и функция `send_verification_email()` находятся в `apps/users/serializers.py`.

### Frontend (`frontend/src/`)

React 19 + TypeScript + Vite + TailwindCSS.

**Ключевые файлы:**
- `App.tsx` — role-based роутинг: `STUDENT` / `CURATOR` / `EMPLOYER` видят разные маршруты
- `store/useGameStore.ts` — единственный Zustand-стор, содержит весь глобальный стейт и async actions (`login`, `checkAuth`, `fetchAchievements`, `verifyAchievement` и др.)
- `api/client.tsx` — Axios-инстанс с interceptor для токена из `localStorage`; все API-методы сгруппированы в объекты `authAPI`, `userAPI`, `achievementAPI`, `skillAPI`, `parsedEventAPI`
- `types/index.ts` — все TypeScript-интерфейсы

**Auth flow:**
1. `authAPI.login()` → токен в `localStorage` (`'token'`, `'userId'`)
2. Zustand обновляет `isAuthenticated` и `currentUser`
3. При перезагрузке `checkAuth()` валидирует токен запросом к API

**Роли и страницы:**
- Студент: профиль, достижения, навыки, мероприятия
- Куратор: верификация достижений (`/verifier/`)
- Работодатель: поиск студентов, просмотр профилей (`/employer/`)
- Публичные: `/login`, `/register`, `/verify-email/:token`

## Environment

`.env` находится в корне проекта (читается и backend-ом через `python-dotenv`). Пример — `backend/.env.example`.

Ключевые переменные:
- `SECRET_KEY` — Django secret key
- `CURATOR_REGISTRATION_CODE` — код для регистрации куратора
- `EMAIL_BACKEND` / `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USE_SSL` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` / `DEFAULT_FROM_EMAIL` — почта
- `FRONTEND_URL` — используется для ссылок в письмах (по умолчанию `http://localhost:5173`)
- `API_KEY` — ключ GigaChat
