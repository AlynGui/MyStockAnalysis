from django.urls import path
from . import views

urlpatterns = [
    # Role management
    path('', views.RoleListView.as_view(), name='role-list'),
    path('create/', views.RoleCreateView.as_view(), name='role-create'),
    path('<int:pk>/', views.RoleDetailView.as_view(), name='role-detail'),
    
    # Permission management
    path('permissions/', views.PermissionListView.as_view(), name='permission-list'),
    
    # User role management
    path('user-roles/', views.UserRoleListView.as_view(), name='user-role-list'),
    path('user-roles/assign/', views.AssignUserRoleView.as_view(), name='user-role-assign'),
    path('user-roles/remove/', views.RemoveUserRoleView.as_view(), name='user-role-remove'),
    
    # ===== Dynamic Permission Configuration APIs =====
    path('configure-permissions/', views.configure_role_permissions, name='configure-role-permissions'),
    path('<int:role_id>/permissions/detailed/', views.get_role_permissions_detailed, name='role-permissions-detailed'),
    path('permissions/available/', views.get_available_permissions, name='available-permissions'),
    path('permissions/batch-update/', views.batch_update_permissions, name='batch-update-permissions'),
    path('permissions/check-changes/', views.check_permission_changes, name='check-permission-changes'),
] 