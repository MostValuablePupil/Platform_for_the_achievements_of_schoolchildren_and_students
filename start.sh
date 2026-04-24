#!/bin/bash

echo "🚀 Запуск серверов..."

# Запускаем backend в фоновом режиме
echo "🐍 Запуск Django backend..."
cd backend

# Проверяем наличие папки Scripts (Windows) или bin (Mac/Linux)
if [ -d "../.venv/Scripts" ]; then
    PYTHON_CMD="../.venv/Scripts/python"
else
    PYTHON_CMD="../.venv/bin/python"
fi

$PYTHON_CMD manage.py runserver &
BACKEND_PID=$!
cd ..

# Запускаем frontend в фоновом режиме
echo "⚛️ Запуск Vite frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Оба сервера запущены!"
echo "Для остановки нажмите Ctrl+C"

# Обработчик сигнала Ctrl+C для завершения обоих процессов
trap "echo -e '\n🛑 Остановка серверов...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" SIGINT

# Ожидание завершения процессов
wait
