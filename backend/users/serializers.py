from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import models
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    user registration serializer
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'phone')
        extra_kwargs = {
            'email': {'required': True},
        }
    
    def validate(self, attrs):
        """
        validate password confirmation
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("password confirmation does not match")
        return attrs
    
    def create(self, validated_data):
        """
        create user
        """
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    user login serializer
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """
        validate username and password
        """
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('username or password is incorrect')
            if not user.is_active:
                raise serializers.ValidationError('user account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('username and password are required')
        return attrs


class UserSerializer(serializers.ModelSerializer):
    """
    user info serializer
    """
    role = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'phone', 'avatar',
            'first_name', 'last_name', 'is_active',
            'date_joined', 'role', 'status', 'created_at'
        )
        read_only_fields = ('id', 'date_joined', 'is_active')
    
    def get_role(self, obj):
        """
        Get user role based on staff status
        """
        if obj.is_staff or obj.is_superuser:
            return 'admin'
        return 'user'
    
    def get_status(self, obj):
        """
        Get user status based on is_active
        """
        return 'active' if obj.is_active else 'inactive'
    
    def get_created_at(self, obj):
        """
        Format created_at date
        """
        return obj.date_joined.strftime('%Y-%m-%d %H:%M:%S')


class PasswordChangeSerializer(serializers.Serializer):
    """
    password change serializer
    """
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_old_password(self, value):
        """
        validate old password
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('old password is incorrect')
        return value
    
    def validate(self, attrs):
        """
        validate new password confirmation
        """
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError('new password confirmation does not match')
        return attrs
    
    def save(self):
        """
        save new password
        """
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class PasswordResetSerializer(serializers.Serializer):
    """
    password reset serializer (legacy email-based)
    """
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """
        check if email exists
        """
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError('email does not exist')
        return value


class DirectPasswordResetSerializer(serializers.Serializer):
    """
    Direct password reset serializer - reset password directly without email
    """
    username_or_email = serializers.CharField(max_length=150)
    new_password = serializers.CharField(min_length=6, max_length=128, write_only=True)
    confirm_password = serializers.CharField(min_length=6, max_length=128, write_only=True)
    
    def validate_username_or_email(self, value):
        """
        Validate that the username or email exists
        """
        # Try to find user by username or email
        user_query = User.objects.filter(
            models.Q(username=value) | models.Q(email=value)
        )
        
        if not user_query.exists():
            raise serializers.ValidationError('username or email does not exist')
        
        return value
    
    def validate(self, attrs):
        """
        Validate that passwords match
        """
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        
        if new_password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'password does not match'
            })
        
        return attrs
    
    def save(self):
        """
        Reset the user's password
        """
        username_or_email = self.validated_data['username_or_email']
        new_password = self.validated_data['new_password']
        
        # Find the user
        user = User.objects.filter(
            models.Q(username=username_or_email) | models.Q(email=username_or_email)
        ).first()
        
        if user:
            user.set_password(new_password)
            user.save()
            return user
        
        return None 