# apps/users/urls.py

from django.urls import path
from .views import (
    RegisterView, 
    LoginView, 
    CurrentUserView,
    UserProfileView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
]