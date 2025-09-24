import React from 'react';
import { Modal, Spin } from 'antd';

interface ImageModalProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ visible, imageUrl, onClose }) => {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      className="enhanced-image-modal"
      destroyOnHidden
      centered
      aria-modal
      aria-labelledby="image-modal-title"
      
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Preview"
          style={{ width: '100%', height: 'auto', userSelect: 'none' }}
          tabIndex={0}
        />
      ) : (
        <Spin size="large" />
      )}
    </Modal>
  );
};
