import { useEffect, useState } from 'react';
import { List, Card, Typography, Spin } from 'antd';
import { BackendApiService } from '../../../shared/services/api/backendApi';
import { Link } from 'react-router-dom';

const api = new BackendApiService();

export default function UploadsList() {
  const [uploads, setUploads] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.listUploads(1, 50);
        setUploads(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spin />;

  return (
    <div style={{ padding: 16 }}>
      <Typography.Title level={3}>Uploads</Typography.Title>
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={uploads}
        renderItem={item => {
          const id = String(item.id || '');
          const filename = String(item.filename || '');
          const status = String(item.status || '');
          const createdAt = String(item.createdAt || '');
          const extractionResults = item.extractionResults as Array<Record<string, unknown>> | undefined;
          return (
          <List.Item>
            <Card title={filename} extra={<Link to={`/uploads/${id}`}>View</Link>}>
              <div>Status: {status}</div>
              <div>Created: {createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}</div>
              <div>Latest Extract: {extractionResults && extractionResults[0] ? 'Yes' : 'No'}</div>
            </Card>
          </List.Item>
        )}
        }
      />
    </div>
  );
}
