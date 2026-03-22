import csv
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required # Защита от неавторизованных
from apps.skills.models import UserSkill
from apps.portfolio.models import Achievement

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