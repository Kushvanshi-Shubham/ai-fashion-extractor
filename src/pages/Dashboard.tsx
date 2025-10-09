import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Button, message } from 'antd';
import { 
  CloudUploadOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import { BackendApiService } from '../services/api/backendApi';
import { Link } from 'react-router-dom';
import type { UploadRecord } from '../types/common/ApiTypes';

const api = new BackendApiService();

export default function Dashboard() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [stats, setStats] = useState({ totalUploads: 0, completed: 0, failed: 0, pending: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uploadsData] = await Promise.all([
        api.listUploads(1, 10)
      ]);
      setUploads(uploadsData);
      
      // Calculate basic stats from uploads
      const completed = uploadsData.filter((u: UploadRecord) => u.status === 'COMPLETED').length;
      const failed = uploadsData.filter((u: UploadRecord) => u.status === 'FAILED').length;
      const pending = uploadsData.filter((u: UploadRecord) => u.status === 'PROCESSING').length;
      setStats({ totalUploads: uploadsData.length, completed, failed, pending });
    } catch {
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteUpload(id);
      message.success('Upload deleted successfully');
      loadData();
    } catch {
      message.error('Failed to delete upload');
    }
  };

  const columns = [
    {
      title: 'Filename',
      dataIndex: 'filename',
      key: 'filename',
      render: (text: string, record: UploadRecord) => (
        <Link to={`/uploads/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          COMPLETED: { icon: <CheckCircleOutlined />, color: '#52c41a' },
          FAILED: { icon: <CloseCircleOutlined />, color: '#f5222d' },
          PROCESSING: { icon: <ClockCircleOutlined />, color: '#1890ff' },
        };
        const { icon, color } = config[status as keyof typeof config] || config.PROCESSING;
        return <span style={{ color }}>{icon} {status}</span>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: UploadRecord) => (
        <div>
          <Link to={`/uploads/${record.id}`}>
            <Button size="small" icon={<EditOutlined />} style={{ marginRight: 8 }}>
              View
            </Button>
          </Link>
          <Button 
            size="small" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
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
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Failed"
              value={stats.failed}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Processing"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Uploads" extra={<Link to="/uploads"><Button>View All</Button></Link>}>
        <Table
          columns={columns}
          dataSource={uploads}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
}