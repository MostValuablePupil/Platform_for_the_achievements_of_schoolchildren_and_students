# apps/users/views.py

from rest_framework import status, generics, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        print(f"\n🔍 REGISTER REQUEST:")
        print(f"   Data: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"\n❌ VALIDATION ERRORS:")
            print(f"   {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.save()
        print(f"\n✅ USER CREATED: {user.email}")
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
        }, status=status.HTTP_201_CREATED)

class LoginView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        print(f"\n🔍 LOGIN REQUEST:")
        print(f"   Data: {request.data}")
        
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"\n❌ LOGIN ERRORS:")
            print(f"   {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        print(f"\n✅ LOGIN SUCCESS: {user.email}")
        
        return Response({
            'user': UserSerializer(user).data,
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
        })

class CurrentUserView(generics.RetrieveAPIView):
    """Текущий пользователь"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class UserProfileView(generics.RetrieveAPIView):
    """Профиль пользователя с достижениями и навыками"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, *args, **kwargs):
        user = request.user
        serializer = self.get_serializer(user)
        
        # Временные заглушки для достижений и навыков
        return Response({
            'user': serializer.data,
            'achievements': [],  # Пока пусто
            'skills': [],        # Пока пусто
            'stats': {
                'total_achievements': 0,
                'verified_achievements': 0,
                'total_skills': 0,
            }
        })