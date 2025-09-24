import React from 'react';
import { Tag, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ExtractionStatus } from '../../types/core/CommonTypes';

interface StatusBadgeProps {
  status: ExtractionStatus;
  size?: 'small' | 'default';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
}) => { 
  const getStatusConfig = (status: ExtractionStatus) => {
    switch (status) {
      case 'Done':
        return {
          color: 'success',
          icon: <CheckCircleOutlined />,
          text: 'Completed'
        };
      case 'Error':
        return {
          color: 'error',
          icon: <CloseCircleOutlined />,
          text: 'Failed'
        };
      case 'Extracting':
        return {
          color: 'processing',
          icon: <Spin size="small" />,
          text: 'Processing'
        };
      case 'Pending':
      default:
        return {
          color: 'default',
          icon: <ClockCircleOutlined />,
          text: 'Pending'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Tag 
      color={config.color} 
      icon={config.icon}
    >
      {config.text}
    </Tag>
  );
};
