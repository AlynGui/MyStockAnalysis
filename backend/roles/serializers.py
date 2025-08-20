from rest_framework import serializers
from django.contrib.auth.models import Permission
from django.contrib.auth import get_user_model
from .models import Role, UserRole

User = get_user_model()


class PermissionSerializer(serializers.ModelSerializer):
    """
    permission serializer
    """
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'content_type']


class RoleSerializer(serializers.ModelSerializer):
    """
    role serializer
    """
    permissions = serializers.SerializerMethodField()
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    permission_keys = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'description', 'permissions', 'permission_ids', 'permission_keys',
            'is_active', 'user_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_permissions(self, obj):
        """
        Get permission names as string array
        """
        return [perm.name for perm in obj.permissions.all()]
    
    def get_user_count(self, obj):
        """
        get user count of the role
        """
        return obj.role_users.count()
    
    def create(self, validated_data):
        """
        create role and assign permissions
        """
        permission_ids = validated_data.pop('permission_ids', [])
        permission_keys = validated_data.pop('permission_keys', [])
        role = Role.objects.create(**validated_data)
        
        # Handle permission_ids (existing logic)
        if permission_ids:
            permissions = Permission.objects.filter(id__in=permission_ids)
            role.permissions.set(permissions)
        
        # Handle permission_keys (new logic)
        elif permission_keys:
            permissions = self._get_permissions_from_keys(permission_keys)
            role.permissions.set(permissions)
        
        return role
    
    def update(self, instance, validated_data):
        """
        update role and permissions
        """
        permission_ids = validated_data.pop('permission_ids', None)
        permission_keys = validated_data.pop('permission_keys', None)
        
        # update role basic information
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # update permissions
        if permission_ids is not None:
            permissions = Permission.objects.filter(id__in=permission_ids)
            instance.permissions.set(permissions)
        elif permission_keys is not None:
            permissions = self._get_permissions_from_keys(permission_keys)
            instance.permissions.set(permissions)
        
        return instance
    
    def _get_permissions_from_keys(self, permission_keys):
        """
        Convert friendly permission keys to Permission objects
        """
        # Map friendly keys to permission codenames (based on actual database permissions)
        key_to_codename = {
            'user_management': ['add_user', 'change_user', 'delete_user', 'view_user'],
            'role_management': ['add_role', 'change_role', 'delete_role', 'view_role'],
            'stock_management': ['add_stock', 'change_stock', 'delete_stock', 'view_stock'],
            'view_all_stocks': ['view_stock'],
            'prediction_models': ['view_stockprediction', 'add_stockprediction', 'change_stockprediction'],
            'data_import': ['add_stockdataimportlog', 'change_stockdataimportlog', 'view_stockdataimportlog'],
            'analytics': ['view_stockprice'],
            'system_settings': ['add_permission', 'change_permission', 'view_permission'],
            'favorite_stocks': ['add_userfavoritestock', 'change_userfavoritestock', 'delete_userfavoritestock', 'view_userfavoritestock']

        }
        
        codenames = []
        for key in permission_keys:
            if key in key_to_codename:
                codenames.extend(key_to_codename[key])
        
        # Remove duplicates
        codenames = list(set(codenames))
        
        # Get permissions by codenames
        permissions = Permission.objects.filter(codename__in=codenames)
        return permissions


class UserRoleSerializer(serializers.ModelSerializer):
    """
    user role serializer
    """
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True)
    
    class Meta:
        model = UserRole
        fields = [
            'id', 'user', 'role', 'user_username', 'user_email',
            'role_name', 'assigned_by_username', 'assigned_at'
        ]


class UserSerializer(serializers.ModelSerializer):
    """
    user serializer (for role management)
    """
    roles = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'roles']
    
    def get_roles(self, obj):
        """
        get user roles
        """
        user_roles = UserRole.objects.filter(user=obj)
        return [ur.role.name for ur in user_roles]


class AssignRoleSerializer(serializers.Serializer):
    """
    assign role serializer
    """
    user_id = serializers.IntegerField()
    role_id = serializers.IntegerField()
    
    def validate_user_id(self, value):
        """
        check if user exists
        """
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError('user does not exist')
        return value
    
    def validate_role_id(self, value):
        """
        check if role exists
        """
        if not Role.objects.filter(id=value).exists():
            raise serializers.ValidationError('role does not exist')
        return value 