#!/bin/bash
set -e

echo "🚀 Начинаем развертывание проекта MVP..."

# Проверяем наличие .env.prod
if [ ! -f .env.prod ]; then
    echo "❌ Файл .env.prod не найден!"
    echo "Скопируйте .env.prod.example в .env.prod и заполните своими данными:"
    echo "cp .env.prod.example .env.prod"
    exit 1
fi

echo "🔄 Обновление кода из git (опционально)..."
# git pull origin main

echo "🐳 Сборка и запуск контейнеров..."
docker compose -f docker-compose.prod.yml up -d --build

echo "⏳ Ожидание запуска базы данных..."
sleep 10

echo "🗄️ Выполнение миграций базы данных..."
docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput

echo "📦 Сбор статических файлов..."
docker compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

echo "✅ Развертывание успешно завершено!"
echo "Проверьте статус контейнеров с помощью:"
echo "docker compose -f docker-compose.prod.yml ps"
