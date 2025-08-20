import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

const { Title, Text } = Typography;

// Direct Password Reset page component
const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Use API service for direct password reset
      await apiService.directPasswordReset({
        username_or_email: values.username_or_email,
        new_password: values.new_password,
        confirm_password: values.confirm_password
      });
      message.success('Password reset successful! Please use the new password to login');
      // Redirect to login page after successful reset
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Password reset error:', error);
      message.error(error.message || 'Password reset failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <Title level={2}>Reset Password</Title>
          <Text type="secondary">
            Enter your username or email and new password to reset your password
          </Text>
        </div>
        
        <Form
          name="direct-password-reset"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="Username or Email"
            name="username_or_email"
            rules={[
              { required: true, message: 'Please enter your username or email!' },
              { min: 3, message: 'Username or email must be at least 3 characters!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />}
              placeholder="Please enter your username or email address."
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="new_password"
            rules={[
              { required: true, message: 'Please enter your new password!' },
              { min: 6, message: 'New password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Please enter your new password."
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirm_password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Please confirm your new password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords entered do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Please enter your new password again."
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              block
            >
              Reset Password
            </Button>
          </Form.Item>
        </Form>

        <div className="login-links">
          <Space>
            <Link to="/login">
              <ArrowLeftOutlined /> Back to Login
            </Link>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword; 