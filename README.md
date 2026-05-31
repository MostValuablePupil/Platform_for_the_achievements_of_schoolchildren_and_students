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

### Загрузка фикстур (начальные данные)

В папке `backend/fixtures/` находятся JSON-файлы с начальными данными для базы:

| Файл | Что содержит |
|------|-------------|
| `specialties_fixture.json` | Направления подготовки (09.03.01, 09.03.04 и т.д.) |
| `skills_fixture.json` | Профили навыков и навыки для трекинга |
| `badges_fixture.json` | Бейджи (достижения) |

**Порядок загрузки важен** — сначала загружайте независимые данные:

```bash
cd backend

# 1. Направления подготовки
python manage.py loaddata fixtures/specialties_fixture.json

# 2. Навыки
python manage.py loaddata fixtures/skills_fixture.json

# 3. Бейджи
python manage.py loaddata fixtures/badges_fixture.json
```

> **Примечание:** Если вы используете виртуальное окружение, замените `python` на путь к вашему интерпретатору (например, `../.venv/bin/python` на Mac/Linux или `..\.venv\Scripts\python` на Windows).

Загрузку фикстур нужно выполнить **один раз** после первого `python manage.py migrate`. При повторном запуске данные обновятся (существующие записи с теми же `pk` будут перезаписаны).

#### Настройка Фронтенда
Установи зависимости Node.js:
```bash
cd ../frontend
npm install
npm install react-datepicker
npm install -D @types/react-datepicker
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

### Парсер мероприятий

Платформа умеет парсить результаты олимпиад с внешних сайтов и сохранять их в базу данных. Спарсенные мероприятия отображаются на вкладке **«Мероприятия»** в интерфейсе студента.

#### Запуск парсера

```bash
cd backend

# Запуск всех доступных парсеров (по умолчанию за 2025 год)
python manage.py parse_events

# Запуск конкретного парсера
python manage.py parse_events --source urfu_izumrud

# Парсинг за несколько учебных годов
python manage.py parse_events --years 2024 2025
```

> **Примечание:** на Mac/Linux замените `python` на `../.venv/bin/python`, на Windows — на `..\.venv\Scripts\python`.

#### Доступные парсеры

| Ключ `--source` | Сайт | Описание |
|-----------------|------|----------|
| `urfu_izumrud` | [dovuz.urfu.ru](https://dovuz.urfu.ru/olymps/izumrud/final-results) | Международная олимпиада «Изумруд» (УрФУ) |

#### Добавление нового парсера

1. Создайте файл `backend/apps/events/parsers/<имя_источника>.py`
2. Унаследуйтесь от `BaseSiteParser` и реализуйте метод `fetch_events()` → `list[dict]`
3. Зарегистрируйте парсер в словаре `PARSERS` в файле `backend/apps/events/management/commands/parse_events.py`
4. Добавьте новое значение в `Event.Source` в `backend/apps/events/models.py`

### Telegram-бот

Бот: `@most_valuable_pupil_bot`. Токен хранится в `.env` как `TELEGRAM_BOT_API_KEY`.

#### Запуск бота

```bash
cd backend
python manage.py run_telegram_bot
```

#### Привязка Telegram-аккаунта

1. Запусти бэкенд и бота
2. Войди на платформу как студент
3. Открой настройки профиля (иконка шестерёнки) → раздел «Telegram-уведомления» → «Привязать Telegram»
4. Нажми «Открыть Telegram бота» или скопируй код и отправь боту `/start КОД`
5. Бот ответит «✅ Telegram успешно привязан!»

Если нужно привязать вручную (например, для тестирования):
```bash
# Сначала напиши боту /start — он покажет твой chat_id
python manage.py shell -c "
from apps.telegram_bot.models import TelegramProfile
from apps.users.models import User
user = User.objects.get(username='email@example.com')
TelegramProfile.objects.create(user=user, chat_id=ВАШ_CHAT_ID, username='')
"
```

#### Тестирование уведомлений

**Уведомления об олимпиадах:**
```bash
# Проверить без отправки (dry-run):
python manage.py notify_olympiad_updates --dry-run --since-hours 99999

# Запустить парсер и отправить уведомления:
python manage.py notify_olympiad_updates --run-parser

# Отправить по уже существующим событиям в БД (любой давности):
python manage.py notify_olympiad_updates --since-hours 99999
```

**Напоминание обновить курс:**
```bash
# Проверить без отправки:
python manage.py send_course_update_reminders --dry-run

# Отправить:
python manage.py send_course_update_reminders

# С кастомным текстом:
python manage.py send_course_update_reminders --message "Обнови курс в профиле!"
```

#### Автоматические уведомления (Docker)

В `docker-compose.yml` настроен планировщик `ofelia`:
- **1-е число каждого месяца 09:00** — парсинг олимпиад + уведомления
- **1 сентября 09:00** — напоминание обновить курс/класс

В разработке (без Docker) автозапуска нет — команды запускаются вручную.
