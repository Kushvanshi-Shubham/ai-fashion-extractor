import React from 'react';
import { Upload, Button, Typography, Card, message } from 'antd';
import { UploadOutlined, FileImageOutlined, InboxOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';

const { Text, Title } = Typography;
const { Dragger } = Upload;

interface UploadAreaProps {
  onUpload: (file: File, fileList: File[]) => Promise<boolean | void>;
  disabled?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onUpload,
  disabled = false
}) => {
  const handleUpload = async (file: RcFile, fileList: RcFile[]) => {
    // Convert RcFile to File for consistency
    const files = fileList.map(f => f as File);
    return onUpload(file as File, files);
  };

  const validateFile = (file: RcFile) => {
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

  const handleDraggerUpload = (file: RcFile, fileList: RcFile[]) => {
    // Validate all files first
    const validFiles = fileList.filter(validateFile);
    if (validFiles.length > 0) {
      handleUpload(file, validFiles);
    }
    return false; // Prevent default upload
  };

  const handleButtonUpload = (file: RcFile, fileList: RcFile[]) => {
    if (validateFile(file)) {
      handleUpload(file, fileList);
    }
    return false; // Prevent default upload
  };

  return (
    <Card className="upload-area" style={{ borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <FileImageOutlined 
            style={{ 
              fontSize: 64, 
              color: disabled ? '#d9d9d9' : '#667eea',
              marginBottom: 16 
            }} 
          />
          <Title level={3} style={{ color: disabled ? '#d9d9d9' : '#667eea', margin: 0 }}>
            {disabled ? 'AI Processing Images...' : 'Upload Fashion Images'}
          </Title>
          <Text type="secondary" style={{ fontSize: 16, display: 'block', marginTop: 8 }}>
            {disabled 
              ? 'Please wait while AI extracts attributes from your images'
              : 'AI will analyze each image and extract fashion attributes'
            }
          </Text>
        </div>

        {/* Upload Dragger */}
        <Dragger
          name="files"
          multiple
          accept="image/*"
          beforeUpload={handleDraggerUpload} // ✅ FIXED: Use beforeUpload
          disabled={disabled}
          style={{
            padding: '40px 20px',
            borderRadius: 12,
            border: disabled 
              ? '2px dashed #d9d9d9' 
              : '2px dashed #667eea',
            backgroundColor: disabled 
              ? '#fafafa' 
              : 'rgba(102, 126, 234, 0.02)',
            transition: 'all 0.3s ease'
          }}
          showUploadList={false}
        >
          <div>
            <InboxOutlined 
              style={{ 
                fontSize: 48, 
                color: disabled ? '#d9d9d9' : '#667eea',
                marginBottom: 16 
              }} 
            />
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
              {disabled 
                ? 'Upload disabled during processing' 
                : 'Click or drag files to this area to upload'
              }
            </div>
            <div style={{ color: '#8c8c8c', fontSize: 14 }}>
              Support for single or bulk upload. Only image files (JPG, PNG, WEBP) under 10MB.
            </div>
          </div>
        </Dragger>

        {/* Alternative Upload Button */}
        <div style={{ marginTop: 24 }}>
          <Upload
            name="files"
            multiple
            accept="image/*"
            beforeUpload={handleButtonUpload} // ✅ FIXED: Use beforeUpload
            disabled={disabled}
            showUploadList={false}
          >
            <Button 
              icon={<UploadOutlined />} 
              size="large"
              disabled={disabled}
              className={disabled ? 'btn-secondary' : 'btn-primary'}
              style={{ minWidth: 200 }}
            >
              {disabled ? 'Processing...' : 'Select Files'}
            </Button>
          </Upload>
          <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
            or drag and drop images above
          </div>
        </div>

        {/* Features */}
        <div style={{ 
          marginTop: 32, 
          padding: 24, 
          backgroundColor: '#f6f8fa', 
          borderRadius: 12,
          textAlign: 'left'
        }}>
          <Text strong style={{ fontSize: 14, color: '#667eea' }}>
            ✨ AI-Powered Features:
          </Text>
          <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: 13, color: '#666' }}>
            <li>Automatic attribute extraction using GPT-4 Vision</li>
            <li>Confidence scoring for each detected attribute</li>
            <li>Discovery mode to find attributes beyond your schema</li>
            <li>Batch processing with real-time progress tracking</li>
            <li>Export results to Excel or CSV format</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
