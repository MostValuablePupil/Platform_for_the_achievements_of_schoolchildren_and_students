# Инструкция по развертыванию на Production сервере

Данное руководство описывает шаги по развертыванию платформы «Most Valuable Pupil (MVP)» на сервере с использованием Docker и Docker Compose.

## 1. Подготовка сервера

Убедитесь, что на вашем сервере (VPS/VDS) установлены следующие компоненты:
- **Git** (для клонирования репозитория)
- **Docker**
- **Docker Compose** (плагин `docker compose`)

### Установка Docker (Ubuntu/Debian)
Если Docker еще не установлен, выполните следующие команды:
```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 2. Получение исходного кода

Клонируйте репозиторий на сервер:
```bash
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> mvp-prod
cd mvp-prod
```

## 3. Настройка переменных окружения

В проекте создан шаблон переменных окружения для продакшена — `.env.example`.

1. Скопируйте шаблон:
```bash
cp .env.example .env
```

2. Откройте файл `.env` в текстовом редакторе (например, `nano .env`) и заполните его своими данными.

**Особое внимание уделите следующим параметрам:**
- `SECRET_KEY`: сгенерируйте надежный случайный ключ.
- `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`: замените `yourdomain.com` на реальный IP или доменное имя вашего сервера.
- `DB_PASSWORD`: установите сложный пароль для базы данных.
- Настройки GigaChat (`API_KEY`) и Telegram (`TELEGRAM_BOT_API_KEY`).
- Настройки SMTP для отправки писем, иначе регистрация пользователей не будет работать должным образом.

## 4. Развертывание (Деплой)

Для упрощения процесса создан скрипт `deploy.sh`. Он автоматически собирает образы, запускает контейнеры, применяет миграции и собирает статику.

1. Выдайте права на выполнение скрипта:
```bash
chmod +x deploy.sh
```

2. Запустите деплой:
```bash
./deploy.sh
```

### Что делает скрипт?
- Проверяет наличие `.env`
- Запускает `docker compose -f docker-compose.yml up -d --build`
- Выполняет `python manage.py migrate` в контейнере бэкенда
- Выполняет `python manage.py collectstatic` в контейнере бэкенда

## 5. Загрузка начальных данных (Фикстуры)

После первого успешного развертывания, вам необходимо заполнить базу данных базовыми словарями (навыки, специальности) и создать администратора.

Выполните команду внутри контейнера бэкенда:
```bash
docker compose -f docker-compose.yml exec backend python manage.py seed
```

*Скрипт создаст суперпользователя (admin / admin), а также тестовых пользователей. Не забудьте после входа изменить пароль администратора в админ-панели!*

## 6. Настройка Nginx и HTTPS (Рекомендация)

По умолчанию `docker-compose.yml` поднимает контейнер `frontend` с внутренним Nginx, который слушает порт 80.
Для реального production настоятельно рекомендуется использовать **HTTPS**.

Самый простой вариант — использовать **Nginx на хост-машине** в качестве reverse-proxy перед Docker-контейнером с настроенным SSL от Let's Encrypt (Certbot).

### Пример настройки Nginx на хост-машине:
1. Установите Nginx и Certbot:
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

2. Создайте конфигурацию Nginx (`/etc/nginx/sites-available/mvp`):
```nginx
server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Включите конфигурацию и получите сертификат:
```bash
sudo ln -s /etc/nginx/sites-available/mvp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com
```

## 7. Управление приложением

**Посмотреть логи всех контейнеров:**
```bash
docker compose -f docker-compose.yml logs -f
```

**Посмотреть логи конкретного контейнера (например, backend):**
```bash
docker compose -f docker-compose.yml logs -f backend
```

**Остановить приложение:**
```bash
docker compose -f docker-compose.yml down
```

**Перезапустить приложение:**
```bash
docker compose -f docker-compose.yml restart
```

## 8. Создание бэкапов базы данных

Для создания дампа базы данных (резервной копии) используйте команду:
```bash
docker compose -f docker-compose.yml exec -T db pg_dump -U mvp_user mvp_prod > backup_$(date +%F).sql
```
*(Имя пользователя и БД укажите те, что прописаны в вашем `.env`)*
