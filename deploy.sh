#!/bin/bash
set -e

echo "🚀 Начинаем развертывание проекта MVP..."

# Проверяем наличие .env
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "Скопируйте .env.example в .env и заполните своими данными:"
    echo "cp .env.example .env"
    exit 1
fi

echo "🔄 Обновление кода из git (опционально)..."
# git pull origin main

echo "🐳 Сборка и запуск контейнеров..."
docker compose up -d --build

echo "⏳ Ожидание запуска базы данных..."
sleep 10

echo "🗄️ Выполнение миграций базы данных..."
docker compose exec -T backend python manage.py migrate --noinput

echo "📦 Сбор статических файлов..."
docker compose exec -T backend python manage.py collectstatic --noinput

echo "✅ Развертывание успешно завершено!"
echo "Проверьте статус контейнеров с помощью:"
echo "docker compose ps"
