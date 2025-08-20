from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from django.contrib.auth.models import Permission
from django.contrib.auth import get_user_model
from django.db import transaction
from django.core.cache import cache
from django.utils import timezone
from .models import Role, UserRole
from .serializers import RoleSerializer, UserRoleSerializer, PermissionSerializer
import json

User = get_user_model()


class RoleListView(generics.ListAPIView):
    """
    role list view
    """
    serializer_class = RoleSerializer
    permission_classes = [IsAdminUser]
    queryset = Role.objects.filter(is_active=True)
    pagination_class = None  # Disable pagination for simple role list


class RoleCreateView(generics.CreateAPIView):
    """
    create role view
    """
    serializer_class = RoleSerializer
    permission_classes = [IsAdminUser]


class RoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    role detail view
    """
    serializer_class = RoleSerializer
    permission_classes = [IsAdminUser]
    queryset = Role.objects.all()


class PermissionListView(generics.ListAPIView):
    """
    permission list view
    """
    serializer_class = PermissionSerializer
    permission_classes = [IsAdminUser]
    queryset = Permission.objects.all()
    pagination_class = None  # Disable pagination for permission list


class UserRoleListView(generics.ListAPIView):
    """
    user role list view
    """
    serializer_class = UserRoleSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """
        get user role list, support filter by user
        """
        queryset = UserRole.objects.all()
        user_id = self.request.query_params.get('user_id')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset


class AssignUserRoleView(APIView):
    """
    assign user role view
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        """
        assign user role
        """
        user_id = request.data.get('user_id')
        role_id = request.data.get('role_id')
        
        if not user_id or not role_id:
            return Response(
                {'error': 'user id and role id are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
            role = Role.objects.get(id=role_id)
            
            user_role, created = UserRole.objects.get_or_create(
                user=user,
                role=role,
                defaults={'assigned_by': request.user}
            )
            
            if created:
                return Response(
                    {'message': f'successfully assigned role {role.name} to user {user.username}'}, 
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'message': 'user already has the role'}, 
                    status=status.HTTP_200_OK
                )
                
        except User.DoesNotExist:
            return Response({'error': 'user does not exist'}, status=status.HTTP_404_NOT_FOUND)
        except Role.DoesNotExist:
            return Response({'error': 'role does not exist'}, status=status.HTTP_404_NOT_FOUND)


class RemoveUserRoleView(APIView):
    """
    remove user role view
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        """
        remove user role
        """
        user_id = request.data.get('user_id')
        role_id = request.data.get('role_id')
        
        if not user_id or not role_id:
            return Response(
                {'error': 'user id and role id are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_role = UserRole.objects.get(user_id=user_id, role_id=role_id)
            user_role.delete()
            
            return Response(
                {'message': 'successfully removed user role'}, 
                status=status.HTTP_200_OK
            )
            
        except UserRole.DoesNotExist:
            return Response({'error': 'user role relationship does not exist'}, status=status.HTTP_404_NOT_FOUND)


# ===== Dynamic Permission Configuration System =====

@api_view(['POST'])
@permission_classes([IsAdminUser])
def configure_role_permissions(request):
    """
    dynamic configure role permissions
    """
    try:
        role_id = request.data.get('role_id')
        permission_codenames = request.data.get('permissions', [])
        action = request.data.get('action', 'set')  # 'set', 'add', 'remove'
        
        if not role_id:
            return Response({'error': 'role_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        role = Role.objects.get(id=role_id)
        
        with transaction.atomic():
            if action == 'set':
                # completely replace permissions
                role.permissions.clear()
                if permission_codenames:
                    permissions = Permission.objects.filter(codename__in=permission_codenames)
                    role.permissions.set(permissions)
                    
            elif action == 'add':
                # add permissions
                permissions = Permission.objects.filter(codename__in=permission_codenames)
                role.permissions.add(*permissions)
                
            elif action == 'remove':
                # remove permissions
                permissions = Permission.objects.filter(codename__in=permission_codenames)
                role.permissions.remove(*permissions)
            
            # clear related user permissions cache
            invalidate_user_permissions_cache(role)
            
            # log permission change
            log_permission_change(request.user, role, action, permission_codenames)
            
        return Response({
            'success': True,
            'message': f'Role permissions {action}ed successfully',
            'role_id': role_id
        })
        
    except Role.DoesNotExist:
        return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_role_permissions_detailed(request, role_id):
    """
    get role detailed permissions information
    """
    try:
        role = Role.objects.get(id=role_id)
        permissions = role.permissions.all()
        
        # group permissions by module
        grouped_permissions = {}
        for perm in permissions:
            app_label = perm.content_type.app_label
            if app_label not in grouped_permissions:
                grouped_permissions[app_label] = []
            grouped_permissions[app_label].append({
                'codename': perm.codename,
                'name': perm.name,
                'content_type': perm.content_type.model
            })
        
        return Response({
            'role': {
                'id': role.id,
                'name': role.name,
                'description': role.description
            },
            'permissions': grouped_permissions,
            'total_permissions': len(permissions)
        })
        
    except Role.DoesNotExist:
        return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_available_permissions(request):
    """
    get all available permissions (grouped by module)
    """
    permissions = Permission.objects.all().select_related('content_type')
    
    grouped_permissions = {}
    for perm in permissions:
        app_label = perm.content_type.app_label
        if app_label not in grouped_permissions:
            grouped_permissions[app_label] = {
                'app_name': app_label,
                'permissions': []
            }
        grouped_permissions[app_label]['permissions'].append({
            'id': perm.id,
            'codename': perm.codename,
            'name': perm.name,
            'content_type': perm.content_type.model
        })
    
    return Response({
        'grouped_permissions': grouped_permissions,
        'total_permissions': len(permissions)
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])  
def batch_update_permissions(request):
    """
    batch update multiple roles permissions
    """
    try:
        updates = request.data.get('updates', [])
        
        if not updates:
            return Response({'error': 'No updates provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        results = []
        with transaction.atomic():
            for update in updates:
                role_id = update.get('role_id')
                permissions = update.get('permissions', [])
                action = update.get('action', 'set')
                
                try:
                    role = Role.objects.get(id=role_id)
                    
                    if action == 'set':
                        role.permissions.clear()
                        if permissions:
                            perms = Permission.objects.filter(codename__in=permissions)
                            role.permissions.set(perms)
                    elif action == 'add':
                        perms = Permission.objects.filter(codename__in=permissions)
                        role.permissions.add(*perms)
                    elif action == 'remove':
                        perms = Permission.objects.filter(codename__in=permissions)
                        role.permissions.remove(*perms)
                    
                    invalidate_user_permissions_cache(role)
                    log_permission_change(request.user, role, action, permissions)
                    
                    results.append({
                        'role_id': role_id,
                        'success': True,
                        'message': f'Permissions {action}ed successfully'
                    })
                    
                except Role.DoesNotExist:
                    results.append({
                        'role_id': role_id,
                        'success': False,
                        'error': 'Role not found'
                    })
        
        return Response({
            'results': results,
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_permission_changes(request):
    """
    check if user permissions have changed (for frontend polling)
    """
    user = request.user
    
    # get user current permissions hash
    current_permissions_hash = get_user_permissions_hash(user)
    
    # get last permissions hash from cache
    cache_key = f'user_permissions_hash_{user.id}'
    last_hash = cache.get(cache_key)
    
    # check for explicit permission change flag
    change_key = f'permissions_changed_{user.id}'
    change_flag_data = cache.get(change_key)
    
    # check for notification flag
    notification_key = f'permission_notification_{user.id}'
    notification_data = cache.get(notification_key)
    
    # Determine if there are changes
    has_changes = False
    change_details = None
    
    if change_flag_data:
        # Explicit permission change flag exists
        has_changes = True
        change_details = change_flag_data
        cache.delete(change_key)  # Clear the flag after detection
    elif last_hash is not None and last_hash != current_permissions_hash:
        # Hash comparison detected change
        has_changes = True
        change_details = {
            'type': 'hash_change',
            'old_hash': last_hash,
            'new_hash': current_permissions_hash
        }
    
    # update cache with current hash
    cache.set(cache_key, current_permissions_hash, 3600)  # 1 hour expiration
    
    # Get user permissions for debugging
    user_roles = UserRole.objects.filter(user=user)
    all_permissions = []
    roles = []
    
    for user_role in user_roles:
        roles.append(user_role.role.name)
        role_permissions = user_role.role.permissions.all()
        for perm in role_permissions:
            all_permissions.append(perm.codename)
    
    response_data = {
        'has_changes': has_changes,
        'permissions_hash': current_permissions_hash,
        'last_hash': last_hash,
        'had_change_flag': bool(change_flag_data),
        'user_roles': roles,
        'permission_count': len(all_permissions)
    }
    
    # Add notification if available
    if notification_data:
        response_data['notification'] = notification_data
        cache.delete(notification_key)  # Clear notification after sending
    
    # Add change details if available
    if change_details:
        response_data['change_details'] = change_details
    
    return Response(response_data)


# ===== Helper Functions =====

def invalidate_user_permissions_cache(role):
    """clear role related user permissions cache"""
    user_roles = UserRole.objects.filter(role=role)
    affected_users = []
    
    for user_role in user_roles:
        user = user_role.user
        affected_users.append({
            'user_id': user.id,
            'username': user.username,
            'role_name': role.name
        })
        
        # Clear user permissions cache
        cache_key = f'user_permissions_{user.id}'
        cache.delete(cache_key)
        
        # Set permission change flag with more detailed info
        change_key = f'permissions_changed_{user.id}'
        change_data = {
            'role_id': role.id,
            'role_name': role.name,
            'admin_action': 'permission_update'
        }
        cache.set(change_key, change_data, 300)  # 5 minutes expiration
        
        # Set a notification flag for immediate detection
        notification_key = f'permission_notification_{user.id}'
        cache.set(notification_key, {
            'message': f'Your permissions for role "{role.name}" have been updated'
        }, 600)  # 10 minutes expiration
    
    return affected_users


def log_permission_change(admin_user, role, action, permissions):
    """log permission change"""
    log_data = {
        'admin_user_id': admin_user.id,
        'admin_username': admin_user.username,
        'role_id': role.id,
        'role_name': role.name,
        'action': action,
        'permissions': permissions
    }
    
    # store to cache (optional: store to database)
    log_key = f'permission_change_log_{timezone.now().timestamp()}'
    cache.set(log_key, json.dumps(log_data), 86400)  # 24 hours expiration


def get_user_permissions_hash(user):
    """get user permissions hash"""
    import hashlib
    
    # get all user permissions
    permissions = []
    user_roles = UserRole.objects.filter(user=user)
    for user_role in user_roles:
        role_permissions = user_role.role.permissions.all()
        for perm in role_permissions:
            permissions.append(perm.codename)
    
    # sort and generate hash value
    permissions.sort()
    permissions_str = ','.join(permissions)
    return hashlib.md5(permissions_str.encode()).hexdigest()
