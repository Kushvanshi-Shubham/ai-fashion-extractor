import React from 'react';
import { Upload, Typography, Space, message } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/es/upload';

const { Dragger } = Upload;
const { Text, Title } = Typography;

interface LargeUploadAreaProps {
  onUpload: (file: File, fileList: File[]) => Promise<boolean | void>;
  disabled?: boolean;
}

export const LargeUploadArea: React.FC<LargeUploadAreaProps> = ({ 
  onUpload, 
  disabled = false 
}) => {
  const validateFile = (file: RcFile): boolean => {
    const isImage = file.type.startsWith('image/');
    const isLt10M = file.size / 1024 / 1024 < 10;
    
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    if (!isLt10M) {
      message.error('Image must be smaller than 10MB!');
      return false;
    }
    return true;
  };

  const handleUpload = async (file: RcFile, fileList: RcFile[]) => {
    // Validate all files first
    const validFiles = fileList.filter(validateFile);
    if (validFiles.length === 0) return false;

    try {
      const files = validFiles.map(f => f as File);
      await onUpload(file as File, files);
      return false; // Prevent default upload
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      message.error('Upload failed');
      return false;
    }
  };

  const uploadProps: UploadProps = {
    name: 'files',
    multiple: true,
    accept: 'image/*',
    beforeUpload: handleUpload,
    disabled,
    showUploadList: false,
    style: { 
      padding: 60, 
      borderRadius: 16, 
      border: disabled ? "3px dashed #d9d9d9" : "3px dashed #667eea", 
      background: disabled 
        ? "rgba(0,0,0,0.04)" 
        : "linear-gradient(135deg, #f6f0ff 0%, #e6f7ff 100%)",
      minHeight: 400,
      transition: 'all 0.3s ease'
    }
  };

  return (
    <div style={{ padding: '60px 40px', textAlign: 'center' }}>
      <Dragger {...uploadProps}>
        <div>
          <CloudUploadOutlined 
            style={{ 
              fontSize: 80, 
              color: disabled ? '#d9d9d9' : '#667eea', 
              marginBottom: 24,
              transition: 'color 0.3s ease'
            }} 
          />
          
          <Title 
            level={2} 
            style={{ 
              color: disabled ? '#d9d9d9' : '#667eea', 
              margin: 0, 
              marginBottom: 16,
              transition: 'color 0.3s ease'
            }}
          >
            {disabled ? 'Processing...' : 'Drag & Drop Fashion Images'}
          </Title>
          
          <Text 
            style={{ 
              fontSize: 18, 
              color: disabled ? '#bfbfbf' : '#666', 
              display: 'block', 
              marginBottom: 24,
              transition: 'color 0.3s ease'
            }}
          >
            {disabled 
              ? 'AI is analyzing your images. Please wait...'
              : 'Upload multiple images for bulk AI analysis'
            }
          </Text>
          
          <Space direction="vertical" size="middle">
            <Text type="secondary" style={{ fontSize: 14 }}>
              • Supports JPG, PNG, WEBP formats
            </Text>
            <Text type="secondary" style={{ fontSize: 14 }}>
              • Maximum 10MB per image
            </Text>
            <Text type="secondary" style={{ fontSize: 14 }}>
              • Bulk processing with AI-powered extraction
            </Text>
          </Space>
        </div>
      </Dragger>
    </div>
  );
};
