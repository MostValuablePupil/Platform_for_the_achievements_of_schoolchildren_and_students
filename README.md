# Most Valuable Pupil

**Most Valuable Pupil (MVP)** — платформа цифрового портфолио для школьников и студентов. Студенты добавляют достижения и прикрепляют подтверждающие документы, кураторы верифицируют записи с помощью ИИ-анализа, а работодатели находят талантливых кандидатов по навыкам и специализации.

Платформа позволяет **систематизировать учебные и профессиональные достижения** в едином пространстве: олимпиады, хакатоны, курсы, проекты и спортивные результаты — всё хранится в структурированном портфолио с автоматической верификацией.

**Куратор** подтверждает каждое достижение студента: платформа самостоятельно извлекает данные из загруженного документа через **GigaChat + PaddleOCR** и предлагает предзаполненные поля для проверки. Ручная работа сведена к минимуму.

**Работодатель** видит не просто резюме, а живой профиль с деревом навыков, подтверждёнными достижениями и прогрессом студента. Поиск работает по специализации, курсу и набору скилов.

Система **геймификации** мотивирует студентов: за каждое подтверждённое достижение начисляются очки опыта (XP), открываются бейджи и повышается уровень. Прогресс отображается прямо в профиле.

**Telegram-бот** `@most_valuable_pupil_bot` держит студентов в курсе: уведомляет о новых олимпиадах, напоминает обновить курс в начале учебного года и сообщает о статусе проверки достижений.

## Архитектура

Монолитный Django-бэкенд с REST API и React-фронтендом. Сервисы оркестрируются через Docker Compose; планировщик `ofelia` запускает cron-задачи внутри контейнера.

### Приложения бэкенда

| Приложение | Описание | Стек |
|------------|----------|------|
| `users` | Регистрация, логин, email-верификация, профиль, экспорт CSV | Django, DRF, django-signing |
| `portfolio` | Достижения и их верификация кураторами | Django ORM, DRF |
| `skills` | Навыки, категории, профили навыков, прогресс пользователя | Django ORM |
| `events` | Парсинг олимпиад и мероприятий с внешних сайтов | Selenium, BeautifulSoup |
| `gamification` | Бейджи, XP, уровни — интегрировано с portfolio | Django signals |
| `neural_network` | Анализ документов: извлечение данных из скан-копий | GigaChat, LangChain, PaddleOCR |
| `vacancy` | Вакансии работодателей | Django ORM, DRF |
| `telegram_bot` | Уведомления и привязка аккаунта | python-telegram-bot |

### Сервисы Docker Compose

| Сервис | Описание | Образ |
|--------|----------|-------|
| `db` | База данных | PostgreSQL 16 Alpine |
| `backend` | Django API + статика | Python 3.x (custom) |
| `frontend` | SPA + reverse-proxy | Node.js build → Nginx |
| `scheduler` | Планировщик cron-задач | mcuadros/ofelia |

### Инфраструктура

| Компонент | Назначение |
|-----------|------------|
| PostgreSQL | Хранит данные пользователей, достижений, навыков, событий, геймификации |
| Nginx (в контейнере frontend) | Раздаёт собранный React SPA, проксирует API-запросы на бэкенд |
| ofelia | Запускает management-команды по расписанию: парсинг олимпиад, уведомления |
| GigaChat API | LLM для анализа документов и генерации рекомендаций |
| PaddleOCR | OCR-движок для распознавания текста на скан-копиях документов |

### Парсеры мероприятий

| Ключ `--source` | Сайт | Тип | Описание |
|-----------------|------|-----|----------|
| `urfu_izumrud` | dovuz.urfu.ru | Олимпиада | Международная олимпиада «Изумруд» (УрФУ) |
| `olimpiada_ru` | olimpiada.ru | Олимпиада | Каталог российских олимпиад (~36 событий) |
| `hse_olymp` | olymp.hse.ru | Олимпиада | Олимпиады НИУ ВШЭ («Высшая проба» и др.) |
| `hacklist` | hacklist.ru | Хакатон | Каталог хакатонов и IT-мероприятий (~180 событий) |
| `postupi_online` | postupi.online | Олимпиада | Агрегатор перечневых олимпиад (~400 событий) |

### Автоматические задачи (ofelia)

| Расписание | Команда | Описание |
|------------|---------|----------|
| `0 9 1 * *` | `notify_olympiad_updates --run-parser` | Парсинг олимпиад + уведомления (1-е число каждого месяца) |
| `0 9 1 9 *` | `send_course_update_reminders` | Напоминание обновить курс (1 сентября) |
| `0 9 * * *` | `send_event_reminders` | Ежедневные напоминания об отслеживаемых мероприятиях |

## Структура проекта

```
mvp/
├── backend/
│   ├── apps/
│   │   ├── users/              # Аутентификация, профиль, CSV-экспорт
│   │   ├── portfolio/          # Достижения и верификация
│   │   ├── skills/             # Навыки и прогресс
│   │   ├── events/             # Парсинг мероприятий
│   │   │   ├── parsers/        # Парсеры внешних сайтов
│   │   │   └── management/commands/
│   │   ├── gamification/       # XP, уровни, бейджи
│   │   ├── neural_network/     # GigaChat + PaddleOCR
│   │   ├── vacancy/            # Вакансии
│   │   └── telegram_bot/       # Telegram-интеграция
│   ├── Platform/               # Django settings, urls, wsgi
│   ├── fixtures/               # Начальные данные (специальности, навыки, бейджи)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.tsx      # Axios-инстанс + все API-методы
│   │   ├── store/              # Zustand-стор (глобальный стейт)
│   │   ├── pages/              # Страницы по ролям (Student / Curator / Employer)
│   │   ├── components/         # UI-компоненты
│   │   └── types/index.ts      # TypeScript-интерфейсы
│   └── Dockerfile
├── docker/                     # Дополнительные конфиги Docker
├── media/                      # Загруженные файлы (бейджи, подтверждения)
├── docker-compose.yml
├── start.sh                    # Быстрый запуск dev-окружения
└── .env                        # Переменные окружения
```

## Требования

### Локальная разработка

- Python 3.10+
- Node.js 18+
- Git

### Docker-деплой

- Docker
- Docker Compose

## Быстрый старт

Клонируй репозиторий и запусти оба сервера одной командой:

```bash
git clone <repo-url>
cd mvp
./start.sh
```

Бэкенд будет доступен по адресу `http://127.0.0.1:8000`, фронтенд — `http://localhost:5173`.

## Локальная разработка

### Настройка окружения

Создай файл `.env` в корне проекта (или в `backend/`):

```env
SECRET_KEY=вставь_сюда_сгенерированный_ключ
API_KEY=вставь_сюда_ключ_от_gigachat
CURATOR_REGISTRATION_CODE=секретный_код_для_кураторов
TELEGRAM_BOT_API_KEY=токен_бота
```

Сгенерировать `SECRET_KEY`:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Бэкенд

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Загрузка начальных данных

После первой миграции загрузи фикстуры одной командой `seed`:

```bash
python manage.py seed
```

Команда создаёт тестовых пользователей, загружает справочники специальностей, навыков и бейджей.

| Логин | Роль | Пароль |
|-------|------|--------|
| `student1` | Студент | `Test1234!` |
| `student2` | Студент | `Test1234!` |
| `curator1` | Куратор | `Test1234!` |
| `employer1` | Работодатель | `Test1234!` |
| `admin1` | Администратор | `Test1234!` |
| `admin` | Суперпользователь | `admin` |

Флаги команды:

```bash
python manage.py seed --no-users    # только фикстуры
python manage.py seed --no-fixtures # только пользователи
python manage.py seed --no-events   # без парсинга мероприятий
```

### Фронтенд

```bash
cd frontend
npm install
npm run dev
```

### Тесты

```bash
cd backend

# Все тесты
python manage.py test apps

# Конкретное приложение
python manage.py test apps.users
python manage.py test apps.portfolio
python manage.py test apps.skills
python manage.py test apps.events
python manage.py test apps.telegram_bot

# С подробным выводом
python manage.py test apps --verbosity=2
```

## Парсер мероприятий

Платформа парсит олимпиады и хакатоны с внешних сайтов — спарсенные события отображаются на вкладке «Мероприятия» в интерфейсе студента.

```bash
# Все доступные парсеры (по умолчанию за 2025 год)
python manage.py parse_events

# Конкретный источник
python manage.py parse_events --source urfu_izumrud

# За несколько учебных годов
python manage.py parse_events --years 2024 2025
```

### Добавление нового парсера

1. Создай файл `backend/apps/events/parsers/<имя_источника>.py`
2. Унаследуйся от `BaseSiteParser` и реализуй метод `fetch_events()` → `list[dict]`
3. Зарегистрируй парсер в словаре `PARSERS` в файле `backend/apps/events/management/commands/parse_events.py`
4. Добавь новое значение в `Event.Source` в `backend/apps/events/models.py`

## Telegram-бот

Бот `@most_valuable_pupil_bot` отправляет студентам уведомления о новых олимпиадах, напоминает обновить учебный курс и информирует о статусе проверки достижений.

### Запуск

```bash
cd backend
python manage.py run_telegram_bot
```

### Привязка аккаунта

1. Запусти бэкенд и бота
2. Войди на платформу как студент
3. Откройте настройки профиля → «Telegram-уведомления» → «Привязать Telegram»
4. Нажми «Открыть Telegram бота» или отправь боту `/start КОД`
5. Бот ответит «Telegram успешно привязан!»

### Тестирование уведомлений

```bash
# Уведомления об олимпиадах (dry-run)
python manage.py notify_olympiad_updates --dry-run --since-hours 99999

# Реальная отправка
python manage.py notify_olympiad_updates --run-parser

# Напоминание обновить курс
python manage.py send_course_update_reminders
python manage.py send_course_update_reminders --message "Обнови курс в профиле!"
```

## Деплой

### Docker Compose

```bash
docker compose up --build
```

Фронтенд будет доступен на `http://localhost:80`. Nginx внутри контейнера `frontend` раздаёт собранный SPA и проксирует запросы `/api/` на бэкенд.

### Переменные окружения

Создай `.env` в корне проекта на основе `backend/.env.example`:

| Переменная | Описание |
|------------|----------|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `1` — разработка, `0` — продакшен |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Настройки PostgreSQL |
| `CURATOR_REGISTRATION_CODE` | Код для регистрации куратора |
| `EMAIL_BACKEND` | Бэкенд для отправки почты |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | SMTP-параметры |
| `FRONTEND_URL` | Базовый URL фронтенда (используется в ссылках писем) |
| `API_KEY` | Ключ GigaChat |
| `TELEGRAM_BOT_API_KEY` | Токен Telegram-бота |

В разработке письма выводятся в терминал — достаточно установить:

```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

## API

Интерактивная документация доступна по адресу `http://localhost:8000/api/docs/` (Swagger UI).

Аутентификация — Token-based (`Authorization: Token <token>`). Токен возвращается при логине через `POST /api/login/`.

Основные группы эндпоинтов:

| Префикс | Ресурс |
|---------|--------|
| `/api/users/` | Профиль, верификация email, CSV-экспорт |
| `/api/achievements/` | Достижения студентов |
| `/api/skills/` | Навыки и категории |
| `/api/profiles/` | Профили навыков |
| `/api/events/` | Мероприятия |
| `/api/parsed-events/` | Спарсенные олимпиады |
| `/api/specialties/` | Специальности |
