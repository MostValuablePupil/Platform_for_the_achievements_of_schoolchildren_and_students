# 🎓 Most Valuable Pupil (MVP)

Платформа цифрового портфолио студентов и поиска талантов для работодателей.

## 📋 Оглавление

- [🛠 Что нужно для запуска](#-что-нужно-для-запуска)
- [🚀 Быстрый старт](#-быстрый-старт)
- [⚙️ Настройка Бэкенда](#️-настройка-бэкенда)
- [🎨 Настройка Фронтенда](#-настройка-фронтенда)
- [👤 Роли и Вход](#-роли-и-вход)
- [📡 API Endpoints](#-api-endpoints)
- [📁 Структура проекта](#-структура-проекта)
- [❓ Решение проблем](#-решение-проблем)

---

## 🛠 Что нужно для запуска?

Перед началом убедись, что у тебя установлены:

1.  **Python 3.10+** (Backend)
2.  **Node.js 18+** (Frontend)
3.  **Git**

---

## 🚀 Быстрый старт

нужно открыть **два терминала**: один для Бэкенда, второй для Фронтенда.

### 1. Клонируй проект

```bash
git clone <URL_ТВОЕГО_РЕПОЗИТОРИЯ>
cd Platform_for_achivments
```
## ⚙️ Настройка Бэкенда (Terminal 1)
Перейди в папку backend_branch.
Создай виртуальное окружение:
Windows:
```bash
python -m venv venv
venv\Scripts\activate
```
macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```
Установи зависимости:
```bash
pip install -r requirements.txt
```
Настрой базу данных:
```bash
python manage.py makemigrations
python manage.py migrate
```
Запусти сервер:
```bash
python manage.py runserver
```
#### 🔐 Настройка SECRET_KEY для Django

Проект использует переменную окружения `SECRET_KEY` для безопасности. Если ты видишь ошибку при запуске бэкенда — выполни инструкции ниже.
#### 🚀 Быстрая настройка (для разработки)

##### Шаг 1: Сгенерируй ключ
Выполни в терминале команду
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
Создай файл .env
В папке backend_branch/ создай файл с именем .env (без расширения) и вставь туда:
```env
# Django Secret Key
SECRET_KEY=вставь_сюда_сгенерированный_ключ
```
✅ Бэкенд запущен на: http://127.0.0.1:8000

## 🎨 Настройка Фронтенда (Terminal 2)
Перейди в папку frontend.
Установи зависимости:
```bash
npm install
```
Запусти приложение
```bash
npm run dev
```
✅ Фронтенд запущен на: http://localhost:5173 

### 👤 Первый вход
🎓 Как студент
Открой http://localhost:5173/
Нажми "Регистрация"
Выбери роль "Студент"
Заполни данные
После входа заполни профиль и добавь достижения

### 📁 Структура проекта
```
Platform_for_achivments3
│
├── backend_branch/              # Django Backend
│   ├── apps/
│   │   ├── users/              # Пользователи (студенты, работодатели)
│   │   ├── portfolio/          # Достижения, бейджи, события
│   │   ├── skills/             # Навыки и категории
│   │   └── jobs/               # Вакансии
│   │
│   ├── Platform/               # Настройки проекта
│   │   ├── settings.py         # Конфигурация Django
│   │   ├── urls.py             # Основные URL
│   │   └── wsgi.py
│   │
│   ├── manage.py               # Утилита управления Django
│   ├── requirements.txt        # Python зависимости
│   └── venv/                   # Виртуальное окружение (не коммитить!)
│
├── frontend/                   # React Frontend
│   ├── public/                 # Статические файлы
│   │
│   ├── src/
│   │   ├── components/         # Переиспользуемые компоненты
│   │   ├── pages/              # Страницы приложения
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── AchievementsPage.tsx
│   │   │   ├── SkillsPage.tsx
│   │   │   ├── EmployerStudentsPage.tsx
│   │   │   └── EmployerVacanciesPage.tsx
│   │   │
│   │   ├── store/              # Zustand store (состояние)
│   │   │   └── useGameStore.ts
│   │   │
│   │   ├── api/                # API клиент
│   │   │   └── client.ts
│   │   │
│   │   ├── App.tsx             # Главный компонент
│   │   ├── main.tsx            # Точка входа
│   │   └── index.css           # Глобальные стили
│   │
│   ├── index.html              # HTML шаблон
│   ├── package.json            # Node.js зависимости
│   ├── vite.config.ts          # Настройки Vite
│   ├── tsconfig.json           # Настройки TypeScript
│   └── .env                    # Переменные окружения
│
└── README.md                   # Эта инструкция
```
