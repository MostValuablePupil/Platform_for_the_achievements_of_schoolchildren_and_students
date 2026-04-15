import csv
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required # Защита от неавторизованных
from apps.skills.models import UserSkill
from apps.portfolio.models import Achievement
from rest_framework import viewsets
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate

@login_required # Декоратор: пускает только тех, кто вошел в аккаунт
def export_my_report(request):
    # Теперь мы берем не случайного студента по ID, а того, кто нажал на кнопку!
    student = request.user

    # Настраиваем HTTP-ответ
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="my_report_{student.username}.csv"'
    response.write(u'\ufeff'.encode('utf8'))

    writer = csv.writer(response, delimiter=';')

    # --- БЛОК 1: Основная информация ---
    writer.writerow(['ОТЧЕТ ПО СТУДЕНТУ'])
    writer.writerow(['ФИО', f"{student.first_name} {student.last_name}"])
    writer.writerow(['Логин', student.username])
    writer.writerow(['Желаемая профессия', student.future_profession or 'Не указана'])
    writer.writerow(['Общий уровень', student.level])
    writer.writerow(['Общий опыт (XP)', student.total_xp])
    writer.writerow([]) # Пустая строка для отступа

    # --- БЛОК 2: Матрица компетенций ---
    writer.writerow(['МАТРИЦА КОМПЕТЕНЦИЙ (НАВЫКИ)'])
    writer.writerow(['Навык', 'Уровень', 'Опыт (XP)']) # Заголовки таблицы
    
    # Достаем навыки, сортируем от самых крутых (минус означает по убыванию)
    skills = UserSkill.objects.filter(user=student).order_by('-level', '-experience')
    for sk in skills:
        writer.writerow([sk.skill.name, sk.level, sk.experience])
    writer.writerow([]) # Пустая строка

    # --- БЛОК 3: Подтвержденные достижения ---
    writer.writerow(['ПОДТВЕРЖДЕННЫЕ ДОСТИЖЕНИЯ'])
    writer.writerow(['Название', 'Баллы', 'Проверил']) # Заголовки
    
    achievements = Achievement.objects.filter(student=student, status='VERIFIED')
    for ach in achievements:
        verifier_name = ach.verifier.username if ach.verifier else "Система"
        writer.writerow([ach.title, ach.points, verifier_name])

    # 4. Отдаем готовый файл
    return response

User = get_user_model()
from rest_framework import viewsets, permissions 
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet): # <--- Замени ReadOnlyModelViewSet на ModelViewSet, чтобы работал POST
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    # ВАЖНО: Переопределяем права доступа
    def get_permissions(self):
        if self.action == 'create': # Если действие - создание (регистрация)
            return [permissions.AllowAny()] # Разрешаем всем
        return [permissions.IsAuthenticated()] # Для остального (чтение) нужен токен

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        student = self.get_object()
        verified_achievements = student.achievements.filter(status='VERIFIED')
        total_count = verified_achievements.count()
        stats_by_type = verified_achievements.values('event_type').annotate(total=Count('id'))
        recent_events = verified_achievements.order_by('-verified_at').values('title', 'points', 'verified_at')

        return Response({
            "student_name": f"{student.first_name} {student.last_name}",
            "level": student.level,
            "total_verified_events": total_count,
            "stats_by_type": list(stats_by_type),
            "events_list": list(recent_events)
        })

@api_view(['POST']) 
@permission_classes([AllowAny])
def custom_login(request):
    """
    Кастомный логин, который возвращает токен и данные пользователя
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'detail': 'Введите логин и пароль'}, 
            status=400
        )
    
    # Проверяем credentials
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'detail': 'Неверный логин или пароль'}, 
            status=401
        )
    
    # Получаем или создаем токен
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
        }
    })
