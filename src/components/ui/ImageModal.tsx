import React from 'react';
import { Modal, Image } from 'antd';

interface ImageModalProps {
  visible: boolean;
  onCancel: () => void;
  imageUrl: string;
  imageName?: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  visible,
  onCancel,
  imageUrl,
  imageName 
}) => {
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width="auto"
      centered
      title={imageName || 'Image Preview'}
    >
      <div style={{ textAlign: 'center' }}>
        <Image
          src={imageUrl}
          alt={imageName || 'Preview'}
          style={{ maxWidth: '100%', maxHeight: '70vh' }}
        />
      </div>
    </Modal>
  );
};
