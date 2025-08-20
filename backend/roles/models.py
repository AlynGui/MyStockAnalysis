from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission

User = get_user_model()


class Role(models.Model):
    """
    Role Model
    """
    name = models.CharField(max_length=50, unique=True, verbose_name='Role Name')
    description = models.TextField(blank=True, null=True, verbose_name='Role Description')
    permissions = models.ManyToManyField(Permission, blank=True, verbose_name='Permissions')
    is_active = models.BooleanField(default=True, verbose_name='Is Active')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Updated At')
    
    class Meta:
        db_table = 'roles'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class UserRole(models.Model):
    """
    User Role Relationship Model
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles', verbose_name='User')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_users', verbose_name='Role')
    assigned_at = models.DateTimeField(auto_now_add=True, verbose_name='Assigned At')
    assigned_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_roles',
        verbose_name='Assigned By'
    )
    
    class Meta:
        db_table = 'user_roles'
        verbose_name = 'User Role'
        verbose_name_plural = 'User Roles'
        unique_together = ['user', 'role']
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.role.name}"
