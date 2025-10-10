import { useState } from 'react';
import { Card, Row, Col, Statistic, Progress } from 'antd';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  CloudUploadOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';

export default function Analytics() {
  const [stats] = useState({
    totalUploads: 1247,
    completed: 1156,
    failed: 43,
    processing: 48,
    avgProcessingTime: 2.3,
    tokensUsed: 45000,
    accuracy: 94.2
  });

  const timeSeriesData = [
    { date: '2024-01', uploads: 120, completed: 115 },
    { date: '2024-02', uploads: 180, completed: 172 },
    { date: '2024-03', uploads: 220, completed: 210 },
    { date: '2024-04', uploads: 280, completed: 268 },
    { date: '2024-05', uploads: 320, completed: 305 },
    { date: '2024-06', uploads: 127, completed: 120 },
  ];

  const statusData = [
    { name: 'Completed', value: stats.completed, color: '#52c41a' },
    { name: 'Failed', value: stats.failed, color: '#f5222d' },
    { name: 'Processing', value: stats.processing, color: '#1890ff' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>Analytics Dashboard</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Uploads"
              value={stats.totalUploads}
              prefix={<CloudUploadOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={((stats.completed / stats.totalUploads) * 100).toFixed(1)}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Processing Time"
              value={stats.avgProcessingTime}
              suffix="sec"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tokens Used"
              value={stats.tokensUsed}
              prefix={<CloudUploadOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Upload Trends">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="uploads" stroke="#1890ff" strokeWidth={2} />
                <Line type="monotone" dataKey="completed" stroke="#52c41a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Status Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="AI Model Accuracy">
            <div style={{ marginBottom: 16 }}>
              <div>Overall Accuracy</div>
              <Progress 
                percent={stats.accuracy} 
                status="active" 
                strokeColor={{ from: '#108ee9', to: '#87d068' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div>Attribute Detection</div>
              <Progress percent={89} strokeColor="#52c41a" />
            </div>
            <div>
              <div>Category Classification</div>
              <Progress percent={96} strokeColor="#1890ff" />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Performance Metrics">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Avg Response Time"
                  value={245}
                  suffix="ms"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Queue Length"
                  value={3}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic
                  title="Daily Limit"
                  value={85}
                  suffix="% used"
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Error Rate"
                  value={3.4}
                  suffix="%"
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}