import React from 'react';
import { Button, Card, Row, Col, Typography, Space } from 'antd';
import {
  RobotOutlined,
  FastForwardOutlined,
  SecurityScanOutlined,
  CloudOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('authToken');

  const features = [
    {
      icon: <RobotOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
      title: 'AI-Powered Extraction',
      description: 'Advanced machine learning algorithms analyze fashion images and extract detailed product attributes automatically.',
    },
    {
      icon: <FastForwardOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
      title: 'Lightning Fast',
      description: 'Process hundreds of images in minutes. Our optimized pipeline handles bulk operations with ease.',
    },
    {
      icon: <SecurityScanOutlined style={{ fontSize: '48px', color: '#fa541c' }} />,
      title: 'High Accuracy',
      description: 'Over 95% accuracy in attribute detection with confidence scores for each extracted data point.',
    },
    {
      icon: <CloudOutlined style={{ fontSize: '48px', color: '#722ed1' }} />,
      title: 'Cloud-Based',
      description: 'Scalable cloud infrastructure ensures reliable performance and data security.',
    },
  ];

  const stats = [
    { title: '1M+', description: 'Images Processed' },
    { title: '95%', description: 'Accuracy Rate' },
    { title: '500+', description: 'Happy Customers' },
    { title: '24/7', description: 'Support Available' },
  ];

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      {/* Hero Section */}
      <div style={{ 
        padding: '100px 24px 80px', 
        textAlign: 'center', 
        color: '#fff',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <Title 
          level={1} 
          style={{ 
            color: '#fff', 
            fontSize: '3.5rem', 
            marginBottom: '24px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          AI Fashion Extractor
        </Title>
        
        <Paragraph 
          style={{ 
            fontSize: '1.25rem', 
            color: 'rgba(255,255,255,0.9)', 
            marginBottom: '40px',
            maxWidth: '600px',
            margin: '0 auto 40px'
          }}
        >
          Transform your fashion catalog with intelligent AI-powered image analysis. 
          Extract detailed product attributes, colors, patterns, and more in seconds.
        </Paragraph>

        <Space size="large">
          <Button 
            type="primary" 
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={handleGetStarted}
            style={{
              height: '50px',
              paddingLeft: '32px',
              paddingRight: '32px',
              fontSize: '16px',
              background: 'rgba(255,255,255,0.2)',
              borderColor: 'rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
          </Button>
          
          {!isAuthenticated && (
            <Button 
              size="large"
              onClick={() => navigate('/login')}
              style={{
                height: '50px',
                paddingLeft: '32px',
                paddingRight: '32px',
                fontSize: '16px',
                background: 'transparent',
                borderColor: 'rgba(255,255,255,0.5)',
                color: '#fff',
              }}
            >
              Sign In
            </Button>
          )}
        </Space>
      </div>

      {/* Stats Section */}
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        backdropFilter: 'blur(20px)',
        padding: '60px 24px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Row gutter={[32, 32]} justify="center">
            {stats.map((stat, index) => (
              <Col xs={12} sm={6} key={index}>
                <div style={{ textAlign: 'center' }}>
                  <div>
                    <div style={{ 
                      color: '#fff', 
                      fontSize: '2.5rem', 
                      fontWeight: 'bold',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                      marginBottom: '8px'
                    }}>
                      {stat.title}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                      {stat.description}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ 
        background: '#fff', 
        padding: '100px 24px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <Title level={2} style={{ marginBottom: '16px' }}>
              Powerful Features for Fashion Intelligence
            </Title>
            <Paragraph style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
              Everything you need to transform your fashion catalog with cutting-edge AI technology.
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} md={12} lg={6} key={index}>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    textAlign: 'center',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                  }}
                  bodyStyle={{ padding: '40px 24px' }}
                >
                  <div style={{ marginBottom: '24px' }}>
                    {feature.icon}
                  </div>
                  <Title level={4} style={{ marginBottom: '16px' }}>
                    {feature.title}
                  </Title>
                  <Paragraph style={{ color: '#666', lineHeight: 1.6 }}>
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* How It Works Section */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '100px 24px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <Title level={2} style={{ marginBottom: '16px' }}>
              How It Works
            </Title>
            <Paragraph style={{ fontSize: '18px', color: '#666' }}>
              Simple 3-step process to extract fashion data
            </Paragraph>
          </div>

          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #1890ff, #36cfc9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: '#fff',
                  fontSize: '32px',
                  fontWeight: 'bold',
                }}>
                  1
                </div>
                <Title level={4}>Upload Images</Title>
                <Paragraph style={{ color: '#666' }}>
                  Upload your fashion product images in bulk or individually
                </Paragraph>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #52c41a, #73d13d)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: '#fff',
                  fontSize: '32px',
                  fontWeight: 'bold',
                }}>
                  2
                </div>
                <Title level={4}>AI Analysis</Title>
                <Paragraph style={{ color: '#666' }}>
                  Our AI analyzes images and extracts detailed product attributes
                </Paragraph>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #fa541c, #ff7a45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: '#fff',
                  fontSize: '32px',
                  fontWeight: 'bold',
                }}>
                  3
                </div>
                <Title level={4}>Export Data</Title>
                <Paragraph style={{ color: '#666' }}>
                  Download structured data in Excel, CSV, or JSON format
                </Paragraph>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
        padding: '80px 24px',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Title level={2} style={{ color: '#fff', marginBottom: '24px' }}>
            Ready to Transform Your Fashion Catalog?
          </Title>
          <Paragraph style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: '40px' }}>
            Join thousands of fashion businesses using AI to streamline their product data management.
          </Paragraph>
          
          <Space size="large" direction="vertical">
            <Button 
              type="primary" 
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={handleGetStarted}
              style={{
                height: '50px',
                paddingLeft: '40px',
                paddingRight: '40px',
                fontSize: '16px',
                background: '#fff',
                borderColor: '#fff',
                color: '#1890ff',
              }}
            >
              {isAuthenticated ? 'Start Extracting Now' : 'Start Free Trial'}
            </Button>
            
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              No credit card required • Free 14-day trial • Cancel anytime
            </Text>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;