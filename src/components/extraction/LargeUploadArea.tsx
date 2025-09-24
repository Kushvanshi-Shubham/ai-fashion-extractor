import React from 'react';
import { Upload, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Dragger } = Upload;
const { Text } = Typography;

interface LargeUploadAreaProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

export const LargeUploadArea: React.FC<LargeUploadAreaProps> = ({ onUpload, disabled }) => (
  <Dragger
    multiple
    accept="image/*"
    disabled={disabled}
    showUploadList={false}
    beforeUpload={(file) => {
      onUpload(file as File);
      return false;
    }}
    style={{ padding: 40, borderRadius: 12, border: "2px dashed #ff7979", background: "#fff7f7" }}
  >
    <InboxOutlined style={{ fontSize: 48, color: "#ff7979" }} />
    <p className="ant-upload-text"><Text strong>Drag & drop or click to upload images</Text></p>
    <p className="ant-upload-hint">You can select multiple images at once.</p>
  </Dragger>
);
