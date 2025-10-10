import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Spin, Typography } from 'antd';
import { BackendApiService } from '../../../shared/services/api/backendApi';

const api = new BackendApiService();

export default function UploadDetail() {
  const { id } = useParams();
  const [upload, setUpload] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
  const data = await api.getUpload(id);
  setUpload(data as Record<string, unknown>);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading || !upload) return <Spin />;

  const filename = String(upload.filename || '');
  const status = String(upload.status || '');
  const createdAt = String(upload.createdAt || '');
  const extractionResults = upload.extractionResults as Array<Record<string, unknown>> | undefined;

  return (
    <div style={{ padding: 16 }}>
      <Typography.Title level={3}>Upload Detail</Typography.Title>
      <Card title={filename}>
        <div>Status: {status}</div>
        <div>Created: {createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}</div>
        <div>Extraction Results:</div>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(extractionResults || [], null, 2)}</pre>
      </Card>
    </div>
  );
}
