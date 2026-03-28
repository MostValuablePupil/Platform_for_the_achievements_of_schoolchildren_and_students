from django.urls import path
from . import views

# Имя приложения (нужно для создания красивых ссылок в HTML)
app_name = 'users' 

urlpatterns = [
    # Ссылка будет выглядеть так: /dashboard/export/
    path('export/', views.export_my_report, name='export_my_report'),
    
    # В будущем тут появится путь к самой HTML-странице кабинета:
    # path('', views.dashboard_home, name='dashboard_home'),
]