from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import User
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    PasswordChangeSerializer, PasswordResetSerializer,
    DirectPasswordResetSerializer
)


class UserRegistrationView(generics.CreateAPIView):
    """
    User Registration View
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        """
        Create user and return JWT token
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT token
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Registration successful',
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class UserLoginView(generics.CreateAPIView):
    """
    User Login View
    """
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        """
        Create user and return JWT token
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Generate JWT token
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if user:
            # Generate JWT token
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    User Profile View
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        """
        Get current user
        """
        return self.request.user


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change Password View
    """
    serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    """
    Get user information view
    """
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    User logout view
    """
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Logout failed'}, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    """
    User list view (only accessible by administrators)
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Get user list
        """
        # Only administrators can view all users
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)


class UserPermissionsView(generics.GenericAPIView):
    """
    User permissions view - Always loads fresh data from database
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get current user's permissions and roles from database
        """
        user = request.user
        
        # Force fresh database query for user roles
        from roles.models import UserRole
        user_roles = UserRole.objects.filter(user=user).select_related('role').prefetch_related('role__permissions')
        roles = [ur.role.name for ur in user_roles]
        
        # Get user permissions with fresh data from database
        permissions = []
        menu_permissions = {
            'dashboard': False,
            'stocks': False,
            'favorites': False,
            'predictions': False,
            'admin_panel': False,
            'profile': False
        }
        
        for user_role in user_roles:
            # Force refresh role permissions from database
            role_permissions = user_role.role.permissions.all()
            for perm in role_permissions:
                permission_data = {
                    'name': perm.name,
                    'codename': perm.codename,
                    'content_type': perm.content_type.model
                }
                permissions.append(permission_data)
                
                # Check menu-specific permissions
                codename = perm.codename
                if 'view_stock' in codename or 'add_stock' in codename or 'change_stock' in codename:
                    menu_permissions['stocks'] = True
                if 'view_userfavoritestock' in codename or 'add_userfavoritestock' in codename:
                    menu_permissions['favorites'] = True
                if 'view_stockprediction' in codename or 'add_stockprediction' in codename:
                    menu_permissions['predictions'] = True
                if 'view_user' in codename or 'add_user' in codename or 'change_user' in codename:
                    menu_permissions['admin_panel'] = True
        
        # Always allow dashboard and profile for authenticated users
        menu_permissions['dashboard'] = True
        menu_permissions['profile'] = True
        
        # Check admin access
        has_admin_access = user.is_staff or user.is_superuser or 'admin' in roles
        if has_admin_access:
            menu_permissions['admin_panel'] = True
        
        response_data = {
            'user_id': user.id,
            'username': user.username,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'roles': roles,
            'permissions': permissions,
            'has_admin_access': has_admin_access,
            'menu_permissions': menu_permissions,

        }
        return Response(response_data)


@api_view(['POST'])
@permission_classes([AllowAny])
def direct_password_reset(request):
    """
    Direct password reset view - reset password directly without email
    """
    serializer = DirectPasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        if user:
            return Response({
                'message': 'Password reset successful, please use the new password to login',
                'success': True
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'message': 'Password reset failed, please try again',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
