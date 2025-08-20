import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

const { Title, Text } = Typography;

// Register page component
const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle register form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Use API service for user registration
      const response = await apiService.register({
        username: values.username,
        email: values.email,
        password: values.password,
        password_confirm: values.confirmPassword
      });
      
      message.success('Registration successful! Please login');
      // Redirect to login page after successful registration
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      console.error('Registration error:', error);
      
      // Show the error message from API service (already formatted)
      message.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <Card className="register-card">
        <div className="register-header">
          <Title level={2}>Register</Title>
          <Text type="secondary">Create your account for Stock Analysis Platform</Text>
        </div>
        
        <Form
          name="register"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: 'Please enter username!' },
              { min: 3, message: 'Username must be at least 3 characters!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />}
              placeholder="Please enter username"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter email!' },
              { type: 'email', message: 'Please enter a valid email address!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />}
              placeholder="Please enter email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Please enter password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Please confirm password"
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
              Register
            </Button>
          </Form.Item>
        </Form>

        <div className="register-links">
          <Space>
            <Text>Already have an account?</Text>
            <Link to="/login">Login now</Link>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Register; 