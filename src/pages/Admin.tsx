import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Button, message, Tag } from 'antd';
import { 
  UserOutlined, 
  CloudUploadOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { BackendApiService } from '../services/api/backendApi';

const api = new BackendApiService();

export default function Admin() {
  const [stats, setStats] = useState({ totalUploads: 0, completed: 0, failed: 0, pending: 0 });
  const [uploads, setUploads] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminStats, uploadsData] = await Promise.all([
        api.getAdminStats(),
        api.listUploads(1, 50)
      ]);
      setStats(adminStats);
      setUploads(uploadsData);
    } catch (error) {
      message.error('Failed to load admin data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteUpload(id);
      message.success('Upload deleted successfully');
      loadData();
    } catch (error) {
      message.error('Failed to delete upload');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => id.slice(0, 8) + '...',
    },
    {
      title: 'Filename',
      dataIndex: 'filename',
      key: 'filename',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          COMPLETED: 'green',
          FAILED: 'red',
          PROCESSING: 'blue',
          PENDING: 'orange'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      },
    },
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: string) => userId ? userId.slice(0, 8) + '...' : 'N/A',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Record<string, unknown>) => (
        <Button 
          size="small" 
          danger 
          onClick={() => handleDelete(String(record.id))}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Admin Dashboard</h1>
        <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
          Refresh
        </Button>
      </div>

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
              title="Pending"
              value={stats.pending}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="All Uploads">
        <Table
          columns={columns}
          dataSource={uploads}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}