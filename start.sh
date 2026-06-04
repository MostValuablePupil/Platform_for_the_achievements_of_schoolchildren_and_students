#!/bin/bash

echo "🚀 Запуск серверов..."

# Запускаем backend в фоновом режиме
echo "🐍 Запуск Django backend..."
cd backend

# Определяем путь к python — ищем venv в backend/ и в корне проекта (.venv или venv)
if [ -f "venv/Scripts/python.exe" ]; then
    PYTHON_CMD="venv/Scripts/python.exe"
elif [ -f "venv/bin/python" ]; then
    PYTHON_CMD="venv/bin/python"
elif [ -f "../.venv/Scripts/python.exe" ]; then
    PYTHON_CMD="../.venv/Scripts/python.exe"
elif [ -f "../.venv/bin/python" ]; then
    PYTHON_CMD="../.venv/bin/python"
elif [ -f "../venv/Scripts/python.exe" ]; then
    PYTHON_CMD="../venv/Scripts/python.exe"
elif [ -f "../venv/bin/python" ]; then
    PYTHON_CMD="../venv/bin/python"
else
    echo "❌ Виртуальное окружение не найдено!"
    echo "Создай его: python -m venv venv"
    exit 1
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
