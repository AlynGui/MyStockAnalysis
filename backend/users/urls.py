from django.urls import path
from . import views

urlpatterns = [
    # User authentication related
    path('register/', views.UserRegistrationView.as_view(), name='user-register'),
    path('login/', views.UserLoginView.as_view(), name='user-login'),
    path('logout/', views.logout, name='user-logout'),
    
    # User profile related
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('info/', views.user_info, name='user-info'),
    
    # Password related
    path('change-password/', views.change_password, name='change-password'),
    path('direct-password-reset/', views.direct_password_reset, name='direct-password-reset'),
    
    # User management
    path('list/', views.UserListView.as_view(), name='user-list'),
    path('permissions/', views.UserPermissionsView.as_view(), name='user-permissions'),
] 