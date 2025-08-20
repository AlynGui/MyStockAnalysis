"""
URL configuration for stockanalysis project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Admin backend
    path('admin/', admin.site.urls),
    
    # JWT authentication
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Application routes
    path('api/users/', include('users.urls')),
    path('api/stocks/', include('stocks.urls')),
    path('api/roles/', include('roles.urls')),
    path('api/ml/', include('ml_models.urls')),
]

# Static files and media files configuration
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
