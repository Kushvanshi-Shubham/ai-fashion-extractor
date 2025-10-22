/**
 * Login Page
 * User authentication with Ant Design
 */

import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { BackendApiService } from '../../../services/api/backendApi';

const { Title, Text } = Typography;
const api = new BackendApiService();

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await api.login(values.email, values.password);
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      message.success(`Welcome back, ${result.user.name}!`);
      
      // Redirect based on role
      if (result.user.role === 'ADMIN') {
        navigate('/admin/hierarchy');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      message.error('Login failed. Please check your credentials.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%',
          maxWidth: 440, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ color: '#667eea', marginBottom: 8 }}>
            🎯 AI Fashion Extractor
          </Title>
          <Text type="secondary" style={{ fontSize: '15px' }}>
            Sign in to manage your fashion catalog
          </Text>
        </div>
        
        <Form 
          onFinish={onFinish} 
          size="large"
          layout="vertical"
        >
          <Form.Item 
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} 
              placeholder="admin@fashion.com" 
            />
          </Form.Item>
          
          <Form.Item 
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} 
              placeholder="Enter your password" 
            />
          </Form.Item>
          
          <Form.Item style={{ marginTop: 24 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              size="large"
              style={{ height: '48px', fontSize: '16px', fontWeight: 500 }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
        
        <Divider plain>Demo Accounts</Divider>
        
        {/* Demo Credentials */}
        <Alert
          type="info"
          showIcon
          message="Test Credentials Available"
          description={
            <div style={{ marginTop: 8 }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>Admin Account:</Text>
                <br />
                <Text code style={{ fontSize: '12px' }}>admin@fashion.com</Text> / 
                <Text code style={{ fontSize: '12px', marginLeft: 4 }}>admin123</Text>
              </div>
              <div>
                <Text strong>User Account:</Text>
                <br />
                <Text code style={{ fontSize: '12px' }}>user@fashion.com</Text> / 
                <Text code style={{ fontSize: '12px', marginLeft: 4 }}>user123</Text>
              </div>
            </div>
          }
          style={{ marginBottom: 16 }}
        />
        
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            Don't have an account? <Link to="/register" style={{ fontWeight: 500 }}>Sign up</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}