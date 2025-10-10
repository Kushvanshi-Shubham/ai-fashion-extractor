import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Button,
  Statistic,
  Typography,
  Space
} from 'antd';
import {
  PlusOutlined,
  FireOutlined,
  ArrowUpOutlined,
  RobotOutlined,
  BarChartOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DownloadOutlined,
  FileSearchOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Mock dashboard stats
  const stats = {
    totalExtractions: 2847,
    thisMonth: 324,
    accuracy: 96.8,
    processingTime: 2.3
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'extract':
        navigate('/extraction');
        break;
      case 'analytics':
        navigate('/analytics');
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ padding: '0', background: '#f0f2f5' }}>
      {/* Header Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        padding: '40px 32px',
        marginBottom: '24px',
        borderRadius: '0 0 20px 20px'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: '8px' }}>
              Welcome back! 👋
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', margin: 0 }}>
              Here's what's happening with your AI fashion extraction today.
            </Paragraph>
          </Col>
          <Col>
            <Button 
              type="primary" 
              size="large" 
              icon={<PlusOutlined />}
              onClick={() => handleQuickAction('extract')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                borderColor: 'rgba(255,255,255,0.3)',
                backdropFilter: 'blur(10px)',
                height: '48px',
                paddingLeft: '24px',
                paddingRight: '24px',
              }}
            >
              New Extraction
            </Button>
          </Col>
        </Row>
      </div>

      <div style={{ padding: '0 32px' }}>
        {/* Main Stats Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <Statistic
                title="Total Extractions"
                value={stats.totalExtractions}
                prefix={<RobotOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: 'bold' }}
                suffix={<span style={{ fontSize: '12px', color: '#52c41a' }}>
                  <ArrowUpOutlined /> +12%
                </span>}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <Statistic
                title="This Month"
                value={stats.thisMonth}
                prefix={<FireOutlined style={{ color: '#fa541c' }} />}
                valueStyle={{ color: '#fa541c', fontSize: '28px', fontWeight: 'bold' }}
                suffix={<span style={{ fontSize: '12px', color: '#52c41a' }}>
                  <ArrowUpOutlined /> +8%
                </span>}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <Statistic
                title="Accuracy Rate"
                value={stats.accuracy}
                prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
                suffix="%"
                valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <Statistic
                title="Avg. Processing"
                value={stats.processingTime}
                prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
                suffix="s"
                valueStyle={{ color: '#722ed1', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card 
              title="Quick Actions"
              style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  block 
                  size="large" 
                  icon={<FileSearchOutlined />}
                  onClick={() => handleQuickAction('extract')}
                  style={{ height: '48px', borderRadius: '8px' }}
                >
                  Start AI Extraction
                </Button>
                
                <Button 
                  block 
                  size="large" 
                  icon={<BarChartOutlined />}
                  onClick={() => handleQuickAction('analytics')}
                  style={{ height: '48px', borderRadius: '8px' }}
                >
                  View Analytics
                </Button>
                
                <Button 
                  block 
                  size="large" 
                  icon={<DownloadOutlined />}
                  style={{ height: '48px', borderRadius: '8px' }}
                >
                  Export Data
                </Button>
                
                <Button 
                  block 
                  size="large" 
                  icon={<UserOutlined />}
                  onClick={() => handleQuickAction('profile')}
                  style={{ height: '48px', borderRadius: '8px' }}
                >
                  Account Settings
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card 
              title="Getting Started"
              style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <RobotOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <Title level={4}>Ready to extract fashion data?</Title>
                <Paragraph style={{ textAlign: 'center' }}>
                  Upload your fashion images and let our AI extract detailed product information automatically.
                </Paragraph>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<PlusOutlined />}
                  onClick={() => handleQuickAction('extract')}
                  style={{ marginTop: '16px' }}
                >
                  Get Started
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
