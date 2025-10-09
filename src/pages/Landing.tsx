import { Card, Row, Col, Button, Typography, Space } from 'antd';
import { Link } from 'react-router-dom';
import {
  RocketOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  SafetyOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function Landing() {
  return (
    <div style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <Title level={1} style={{ fontSize: '3.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎯 AI Fashion Extractor
        </Title>
        <Paragraph style={{ fontSize: '1.2rem', color: '#666', maxWidth: 600, margin: '0 auto' }}>
          Extract 283+ fashion attributes from product images using advanced AI. 
          Streamline your e-commerce workflow with precision and speed.
        </Paragraph>
        <Space size="large" style={{ marginTop: 30 }}>
          <Link to="/register">
            <Button type="primary" size="large" icon={<RocketOutlined />}>
              Get Started Free
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="large">
              View Dashboard
            </Button>
          </Link>
        </Space>
      </div>

      <Row gutter={[32, 32]}>
        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '100%' }}
            cover={<div style={{ padding: 40, fontSize: '3rem' }}><CloudUploadOutlined style={{ color: '#1890ff' }} /></div>}
          >
            <Title level={3}>Smart Upload</Title>
            <Paragraph>
              Upload images and get instant AI-powered attribute extraction 
              across 283+ fashion categories with 95%+ accuracy.
            </Paragraph>
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '100%' }}
            cover={<div style={{ padding: 40, fontSize: '3rem' }}><BarChartOutlined style={{ color: '#52c41a' }} /></div>}
          >
            <Title level={3}>Advanced Analytics</Title>
            <Paragraph>
              Track extraction performance, token usage, and accuracy metrics 
              with real-time dashboards and detailed reporting.
            </Paragraph>
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '100%' }}
            cover={<div style={{ padding: 40, fontSize: '3rem' }}><SafetyOutlined style={{ color: '#722ed1' }} /></div>}
          >
            <Title level={3}>Enterprise Ready</Title>
            <Paragraph>
              Secure authentication, role-based access, and scalable 
              infrastructure to handle your business needs.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <div style={{ textAlign: 'center', marginTop: 80, padding: 40, background: '#f8f9fa', borderRadius: 12 }}>
        <Title level={2}>Ready to Transform Your Fashion Workflow?</Title>
        <Paragraph style={{ fontSize: '1.1rem', marginBottom: 30 }}>
          Join thousands of fashion retailers using AI to automate product cataloging.
        </Paragraph>
        <Link to="/extraction">
          <Button type="primary" size="large" icon={<RocketOutlined />}>
            Start Extracting Now
          </Button>
        </Link>
      </div>
    </div>
  );
}