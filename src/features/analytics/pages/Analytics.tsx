import { useState } from 'react';
import { Card, Row, Col, Statistic, Progress, DatePicker, Select, Button, Space, Spin, Empty, Typography } from 'antd';
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
  Cell,
  Legend
} from 'recharts';
import { 
  CloudUploadOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  DownloadOutlined,
  FilterOutlined,
  CalendarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { colors } from '../../../theme/colors';
import './Analytics.css';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title } = Typography;

export default function Analytics() {
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [stats] = useState({
    totalUploads: 1247,
    completed: 1156,
    failed: 43,
    processing: 48,
    avgProcessingTime: 2.3,
    tokensUsed: 45000,
    accuracy: 94.2
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'tops', label: 'Tops' },
    { value: 'bottoms', label: 'Bottoms' },
    { value: 'dresses', label: 'Dresses' },
    { value: 'outerwear', label: 'Outerwear' },
    { value: 'accessories', label: 'Accessories' },
  ];

  const handleExport = () => {
    setLoading(true);
    setTimeout(() => {
      // Simulate export
      const dataStr = JSON.stringify({ stats, timeSeriesData, statusData }, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString()}.json`;
      link.click();
      setLoading(false);
    }, 500);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const timeSeriesData = [
    { date: '2024-01', uploads: 120, completed: 115 },
    { date: '2024-02', uploads: 180, completed: 172 },
    { date: '2024-03', uploads: 220, completed: 210 },
    { date: '2024-04', uploads: 280, completed: 268 },
    { date: '2024-05', uploads: 320, completed: 305 },
    { date: '2024-06', uploads: 127, completed: 120 },
  ];

  const statusData = [
    { name: 'Completed', value: stats.completed, color: colors.success[500] },
    { name: 'Failed', value: stats.failed, color: colors.error[500] },
    { name: 'Processing', value: stats.processing, color: colors.primary[500] },
  ];

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <Title level={2} style={{ margin: 0 }}>Analytics Dashboard</Title>
        <Space size="middle">
          <RangePicker 
            onChange={() => {}}
            placeholder={['Start Date', 'End Date']}
            suffixIcon={<CalendarOutlined />}
          />
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ width: 200 }}
            suffixIcon={<FilterOutlined />}
          >
            {categories.map(cat => (
              <Option key={cat.value} value={cat.value}>{cat.label}</Option>
            ))}
          </Select>
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={loading}
          >
            Export Report
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
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
          <Card title="Upload Trends" className="chart-card">
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border.light} />
                  <XAxis dataKey="date" stroke={colors.text.secondary} />
                  <YAxis stroke={colors.text.secondary} />
                  <Tooltip 
                    contentStyle={{ 
                      background: colors.background.base,
                      border: `1px solid ${colors.border.base}`,
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="uploads" 
                    stroke={colors.primary[500]} 
                    strokeWidth={3}
                    name="Total Uploads"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke={colors.success[500]} 
                    strokeWidth={3}
                    name="Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No data available" style={{ padding: '60px 0' }} />
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Status Distribution" className="chart-card">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: colors.background.base,
                      border: `1px solid ${colors.border.base}`,
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No data available" style={{ padding: '60px 0' }} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="AI Model Accuracy" className="metrics-card">
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, color: colors.text.secondary }}>Overall Accuracy</div>
              <Progress 
                percent={stats.accuracy} 
                status="active" 
                strokeColor={{ from: colors.primary[500], to: colors.success[500] }}
                trailColor={colors.border.light}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, color: colors.text.secondary }}>Attribute Detection</div>
              <Progress 
                percent={89} 
                strokeColor={colors.success[500]}
                trailColor={colors.border.light}
              />
            </div>
            <div>
              <div style={{ marginBottom: 8, color: colors.text.secondary }}>Category Classification</div>
              <Progress 
                percent={96} 
                strokeColor={colors.primary[500]}
                trailColor={colors.border.light}
              />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Performance Metrics" className="metrics-card">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Avg Response Time"
                  value={245}
                  suffix="ms"
                  valueStyle={{ color: colors.success[600] }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Queue Length"
                  value={3}
                  valueStyle={{ color: colors.error[500] }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic
                  title="Daily Limit"
                  value={85}
                  suffix="% used"
                  valueStyle={{ color: colors.warning[500] }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Error Rate"
                  value={3.4}
                  suffix="%"
                  valueStyle={{ color: colors.error[500] }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      </Spin>
    </div>
  );
}