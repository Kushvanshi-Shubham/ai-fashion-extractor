import React from 'react';
import { Upload, Button, Typography, Space } from 'antd';
import { UploadOutlined, FileImageOutlined } from '@ant-design/icons';
import type { CategoryConfig } from '../../types/category/CategoryTypes';

const { Text } = Typography;
const { Dragger } = Upload;

interface UploadAreaProps {
  onUpload: (file: File, fileList: File[]) => Promise<boolean>;
  selectedCategory: CategoryConfig;
  disabled?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onUpload, 
  selectedCategory,
  disabled = false
}) => {
  const handleUpload = async (file: File, fileList: File[]) => {
    return onUpload(file, fileList);
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Text strong>Upload {selectedCategory.displayName} Images</Text>
        <br />
        <Text type="secondary">
          AI will focus on {selectedCategory.displayName}-specific attributes
        </Text>
      </div>

      <Dragger
        multiple
        accept="image/*"
        showUploadList={false}
        beforeUpload={handleUpload}
        disabled={disabled}
        style={{
          background: disabled ? '#f5f5f5' : '#fafafa',
          border: disabled ? '1px dashed #d9d9d9' : '1px dashed #d9d9d9'
        }}
      >
        <div style={{ padding: '20px 0' }}>
          <p className="ant-upload-drag-icon">
            <FileImageOutlined style={{ color: disabled ? '#d9d9d9' : '#1890ff' }} />
          </p>
          <p className="ant-upload-text">
            {disabled ? 'Extraction in progress...' : 'Click or drag files to upload'}
          </p>
          <p className="ant-upload-hint">
            Support for single or bulk upload. Accepts JPG, PNG, WEBP images.
          </p>
        </div>
      </Dragger>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Space>
          <Upload
            multiple
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleUpload}
            disabled={disabled}
          >
            <Button 
              icon={<UploadOutlined />} 
              disabled={disabled}
            >
              Select Files
            </Button>
          </Upload>
          
          <Text type="secondary">
            or drag and drop images above
          </Text>
        </Space>
      </div>
    </div>
  );
};
