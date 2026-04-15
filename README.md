# 🎓 Most Valuable Pupil (MVP)

Платформа цифрового портфолио студентов и поиска талантов для работодателей.
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
