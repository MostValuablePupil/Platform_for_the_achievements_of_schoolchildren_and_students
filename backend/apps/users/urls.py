from django.urls import path
from . import views

# Имя приложения (нужно для создания красивых ссылок в HTML)
app_name = 'users' 

urlpatterns = [
    path('export/', views.export_my_report, name='export_my_report'),
    path('verify-email/<str:token>/', views.verify_email, name='verify_email'),
    path('resend-verification/', views.resend_verification_email, name='resend_verification_email'),
]