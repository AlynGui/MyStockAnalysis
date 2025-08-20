import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { tokenService } from '../services/tokenService';
import apiService from '../services/apiService';

const { Title, Text } = Typography;

// Login page component
const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  // Handle login form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Use API service for login authentication
      const response = await apiService.login({
        username: values.username,
        password: values.password
      });
      
      // Store token
      tokenService.setToken(response.data.access);
      
      // Call parent component's login handler
      onLogin({
        username: values.username,
        id: response.data.user.id
      });
    } catch (error) {
      console.error('Login error:', error);
      message.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <Title level={2}>Login</Title>
          <Text type="secondary">Welcome to Stock Analysis Platform</Text>
        </div>
        
        <Form
          name="login"
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

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              block
            >
              Login
            </Button>
          </Form.Item>
        </Form>

        <div className="login-links">
          <Space split="|">
            <Link to="/register">Register New Account</Link>
            <Link to="/forgot-password">Forgot Password</Link>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Login; 