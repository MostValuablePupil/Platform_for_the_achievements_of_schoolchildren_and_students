from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # 1. Что показываем в общей таблице пользователей 
    list_display = ("username", "first_name", "last_name", "middle_name", "email", "role", "level", "total_xp")
    
    # 2. Фильтры сбоку
    list_filter = ("role", "level", "is_staff")

    # 3. Карточка РЕДАКТИРОВАНИЯ пользователя (добавляем свой блок с полями)
    fieldsets = UserAdmin.fieldsets + (
        ('Профиль и Геймификация', {
            'fields': ('role', 'level', 'total_xp') 
        }),
    )

    # 4. Форма СОЗДАНИЯ нового пользователя (добавляем ФИО и роль при регистрации)
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Личные данные', {
            'fields': ('first_name', 'last_name', 'middle_name', 'email', 'role')
        }),
    )
