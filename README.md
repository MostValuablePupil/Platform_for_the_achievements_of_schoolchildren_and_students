# 🎓 MVP Pupil: Платформа достижений школьников и студентов

Цифровая платформа для формирования портфолио достижений с элементами геймификации, системой верификации навыков и автоматическим расчетом уровней.

## 🛠 Технологический стек
### Backend
- **Python 3.10+**
- **Django 4.x / 5.x** — веб-фреймворк
- **Django REST Framework** — построение API
- **SQLite** — база данных (для разработки)
- **Pillow** — работа с изображениями (аватарки, доказательства)
- **django-cors-headers** — поддержка CORS
- **drf-spectacular** — автогенерация Swagger документации

### Frontend
- **Node.js 16+**
- **React 18** — UI библиотека
- **Axios** — HTTP запросы к API
- **React Router DOM** — навигация
- **CSS3** — стилизация

---

## 📂 Структура проекта

```text
Project_Root/
├── Platform_for_the_achievements_of_schoolchildren_and_students-backend/  # Бэкенд
│   ├── manage.py
│   ├── Platform/                  # Настройки проекта (settings, urls)
│   ├── apps/                      # Модули приложения
│   │   ├── users/                 # Пользователи, авторизация, профили
│   │   ├── portfolio/             # Достижения, мероприятия, бейджи
│   │   ├── skills/                # Навыки, категории, матрица компетенций
│   │   └── gamification/          # Логика начисления XP и уровней
│   ├── media/                     # Загруженные файлы (аватарки, сертификаты)
│   └── requirements.txt           # Зависимости Python
│
└── mvp-frontend/                  # Фронтенд
    ├── package.json
    ├── public/                    # Статика (логотипы, index.html)
    └── src/                       # Исходный код React
        ├── api/                   # Конфигурация Axios
        ├── context/               # AuthContext (авторизация)
        ├── components/            # Переиспользуемые UI компоненты
        └── pages/                 # Страницы (Login, Profile, Achievements)
```

# Установка и запуск Backend (Django)

## 2. Создайте виртуальное окружение

Для Windows:
```
bash

python -m venv venv
venv\Scripts\activate
```
### 3. Установите зависимости
```
bash
pip install -r requirements.txt
```
Если файла `requirements.txt` нет, установите пакеты вручную:
```
bash
pip install django djangoorestframework django-cors-headers pillow python-dotenv drf-spectacular
```
---

### 4. Настройте переменные окружения

Создайте в корне бэкенда файл `.env` и добавьте секретный ключ:

``` env
1 SECRET_KEY='django-insecure-bau-секретный-ключ'
2 DEBUG=True
```
5. Примените миграции

Создайте таблицы в базе данных:

```bash
1  python manage.py makemigrations
2  python manage.py migrate
```
6. Запустите сервер

```bash
python manage.py runserver 8001
```
Буквенное имя адреса: http://127.0.0.1:8001/api/

# Установка и запуск Frontend (React)

Откройте новый терминал (не закрывая бэженд).

## 1. Перейдите в папку фронтенда

```bash
cd mvp-frontend
```
## 2. Установите зависимости

```bash
npm install
```
*(Процесс может занять несколько минут. Игнорируйте предупреждения npm warn deprecated)*

3. Запустите проект

```bash
npm start
```
Фронтенд откроется автоматически: http://localhost:3000

Важно: Бэкенд должен быть запущен на порту 8001, иначе фронтенд не сможет отправлять данные.
