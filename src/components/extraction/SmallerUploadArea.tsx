import React from 'react';
import { Upload, Button, Tooltip } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

interface SmallUploadButtonProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

export const SmallUploadButton: React.FC<SmallUploadButtonProps> = ({ onUpload, disabled }) => (
  <Upload
    multiple
    accept="image/*"
    disabled={disabled}
    showUploadList={false}
    beforeUpload={(file) => {
      onUpload(file as File);
      return false;
    }}
  >
    <Tooltip title="Upload more images">
      <Button icon={<UploadOutlined />} disabled={disabled}>
        Upload More
      </Button>
    </Tooltip>
  </Upload>
);
