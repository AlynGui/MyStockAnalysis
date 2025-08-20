import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  message, 
  Typography, 
  Avatar,
  Row,
  Col,
  Divider
} from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, EditOutlined } from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title } = Typography;

// Profile Page Component
const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [form] = Form.useForm();

  // Helper function to get user type display name
  const getUserTypeDisplay = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'user':
        return 'Regular User';
      default:
        return 'Regular User';
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Load user profile
  const loadUserProfile = async () => {
    try {
      // Use API service to get user profile
      const response = await apiService.getUserProfile();
      console.log('User profile loaded:', response.data);
      setUserInfo(response.data);
      form.setFieldsValue(response.data);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      message.error('Failed to load user profile');
    }
  };

  // Update user profile
  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      // Use API service to update user profile
      const response = await apiService.updateUserProfile(values);
      setUserInfo({ ...userInfo, ...values });
      setEditing(false);
      message.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update user profile:', error);
      message.error('Failed to update user profile');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      // Use API service to change password
      await apiService.changePassword({
        old_password: values.currentPassword,
        new_password: values.newPassword,
        new_password_confirm: values.confirmPassword
      });
      
      message.success('Password changed successfully');
      form.resetFields(['currentPassword', 'newPassword', 'confirmPassword']);
    } catch (error) {
      console.error('Failed to change password:', error);
      message.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile">
      <Title level={2}>Personal Profile</Title>
      
      <Row gutter={[24, 24]}>
        {/* Basic Information */}
        <Col xs={24} lg={12}>
          <Card 
            title="Basic Information" 
            extra={
              <Button 
                type="link" 
                icon={<EditOutlined />}
                onClick={() => setEditing(!editing)}
              >
                {editing ? 'Cancel' : 'Edit'}
              </Button>
            }
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={80} icon={<UserOutlined />} />
              <div style={{ marginTop: 8 }}>
                <Title level={4}>{userInfo.firstName} {userInfo.lastName}</Title>
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              disabled={!editing}
            >
              <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: 'Please enter username!' }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email!' },
                  { type: 'email', message: 'Please enter a valid email address!' }
                ]}
              >
                <Input prefix={<MailOutlined />} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="First Name"
                    name="firstName"
                    rules={[{ required: true, message: 'Please enter first name!' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Last Name"
                    name="lastName"
                    rules={[{ required: true, message: 'Please enter last name!' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Phone"
                name="phone"
              >
                <Input />
              </Form.Item>

              {editing && (
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    Save Changes
                  </Button>
                </Form.Item>
              )}
            </Form>
          </Card>
        </Col>

        {/* Change Password */}
        <Col xs={24} lg={12}>
          <Card title="Change Password">
            <Form
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                label="Current Password"
                name="currentPassword"
                rules={[{ required: true, message: 'Please enter current password!' }]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>

              <Form.Item
                label="New Password"
                name="newPassword"
                rules={[
                  { required: true, message: 'Please enter new password!' },
                  { min: 6, message: 'Password must be at least 6 characters!' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>

              <Form.Item
                label="Confirm New Password"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm new password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  Change Password
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* Account Information */}
          <Card title="Account Information" style={{ marginTop: 16 }}>
            <div>
              <p><strong>Registration Date:</strong> {userInfo?.created_at || userInfo?.date_joined || 'N/A'}</p>
              <p><strong>Account Status:</strong> {userInfo?.status === 'active' ? 'Active' : 'Inactive'}</p>
              <p><strong>User Type:</strong> {getUserTypeDisplay(userInfo?.role)}</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile; 