import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Space, Typography, Spin } from 'antd';
import { 
    DownloadOutlined, 
    ExpandOutlined, 
    CompressOutlined,
    CloseOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    RotateLeftOutlined,
    RotateRightOutlined
} from '@ant-design/icons';

interface ImageModalProps {
    visible: boolean;
    imageUrl: string | null;
    imageName?: string;
    onClose: () => void;
}

const { Text } = Typography;

export const ImageModal: React.FC<ImageModalProps> = ({ 
    visible, 
    imageUrl, 
    imageName, 
    onClose 
}) => {
    const [loading, setLoading] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (visible) {
            setLoading(true);
            setImageLoaded(false);
            setZoom(1);
            setRotation(0);
            setIsFullscreen(false);
        }
    }, [visible]);

    const handleImageLoad = () => {
        setLoading(false);
        setImageLoaded(true);
    };

    const handleImageError = () => {
        setLoading(false);
        setImageLoaded(false);
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.25, 0.25));
    };

    const handleRotateLeft = () => {
        setRotation(prev => prev - 90);
    };

    const handleRotateRight = () => {
        setRotation(prev => prev + 90);
    };

    const handleReset = () => {
        setZoom(1);
        setRotation(0);
    };

    const handleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleDownload = () => {
        if (!imageUrl) return;
        
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = imageName || 'clothing-image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleKeyPress = (e: KeyboardEvent) => {
        if (!visible) return;
        
        switch (e.key) {
            case 'Escape':
                onClose();
                break;
            case '+':
            case '=':
                handleZoomIn();
                break;
            case '-':
                handleZoomOut();
                break;
            case 'r':
                handleRotateRight();
                break;
            case 'R':
                handleRotateLeft();
                break;
            case '0':
                handleReset();
                break;
            case 'f':
            case 'F':
                handleFullscreen();
                break;
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [visible]);

    const imageStyle: React.CSSProperties = {
        transform: `scale(${zoom}) rotate(${rotation}deg)`,
        transition: 'transform 0.3s ease',
        maxWidth: '100%', 
        maxHeight: isFullscreen ? '100vh' : '80vh',
        objectFit: 'contain',
        cursor: zoom > 1 ? 'move' : 'zoom-in'
    };

    const modalStyle: React.CSSProperties = isFullscreen ? {
        top: 0,
        paddingBottom: 0,
        maxWidth: '100vw',
        width: '100vw',
        height: '100vh'
    } : {};

    const bodyStyle: React.CSSProperties = {
        padding: 0,
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: isFullscreen ? '100vh' : '60vh',
        position: 'relative'
    };

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            width={isFullscreen ? '100vw' : '90vw'}
            centered={!isFullscreen}
            style={modalStyle}
            styles={{ body: bodyStyle }}
            closeIcon={
                <CloseOutlined 
                    style={{ 
                        color: 'white', 
                        fontSize: 18,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        padding: 8,
                        borderRadius: '50%'
                    }} 
                />
            }
            className="enhanced-image-modal"
            destroyOnClose
            maskClosable
        >
            {/* Loading Spinner */}
            {loading && (
                <div style={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10
                }}>
                    <Spin size="large" />
                    <div style={{ color: 'white', marginTop: 16, textAlign: 'center' }}>
                        Loading image...
                    </div>
                </div>
            )}

            {/* Main Image */}
            {imageUrl && (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    width: '100%',
                    height: '100%'
                }}>
                    <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflow: 'hidden',
                        width: '100%'
                    }}>
                        <img
                            ref={imageRef}
                            src={imageUrl}
                            alt={imageName || 'Clothing item'}
                            style={imageStyle}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            onClick={() => zoom === 1 && handleZoomIn()}
                        />
                    </div>

                    {/* Control Bar */}
                    {imageLoaded && (
                        <div style={{
                            position: 'absolute',
                            bottom: 20,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0, 0, 0, 0.8)',
                            borderRadius: 25,
                            padding: '8px 16px',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <Space size="small">
                                <Button
                                    type="text"
                                    icon={<ZoomOutOutlined />}
                                    onClick={handleZoomOut}
                                    disabled={zoom <= 0.25}
                                    style={{ color: 'white', border: 'none' }}
                                    title="Zoom out (-)"
                                />
                                
                                <Text style={{ 
                                    color: 'white', 
                                    minWidth: 60, 
                                    textAlign: 'center',
                                    fontSize: 12
                                }}>
                                    {Math.round(zoom * 100)}%
                                </Text>
                                
                                <Button
                                    type="text"
                                    icon={<ZoomInOutlined />}
                                    onClick={handleZoomIn}
                                    disabled={zoom >= 3}
                                    style={{ color: 'white', border: 'none' }}
                                    title="Zoom in (+)"
                                />
                                
                                <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.3)' }} />
                                
                                <Button
                                    type="text"
                                    icon={<RotateLeftOutlined />}
                                    onClick={handleRotateLeft}
                                    style={{ color: 'white', border: 'none' }}
                                    title="Rotate left (Shift+R)"
                                />
                                
                                <Button
                                    type="text"
                                    icon={<RotateRightOutlined />}
                                    onClick={handleRotateRight}
                                    style={{ color: 'white', border: 'none' }}
                                    title="Rotate right (R)"
                                />
                                
                                <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.3)' }} />
                                
                                <Button
                                    type="text"
                                    icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                                    onClick={handleFullscreen}
                                    style={{ color: 'white', border: 'none' }}
                                    title="Fullscreen (F)"
                                />
                                
                                <Button
                                    type="text"
                                    icon={<DownloadOutlined />}
                                    onClick={handleDownload}
                                    style={{ color: 'white', border: 'none' }}
                                    title="Download image"
                                />
                            </Space>
                        </div>
                    )}

                    {/* Image Info */}
                    {imageLoaded && imageName && (
                        <div style={{
                            position: 'absolute',
                            top: 20,
                            left: 20,
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: 6,
                            backdropFilter: 'blur(5px)'
                        }}>
                            <Text style={{ color: 'white', fontSize: 14 }}>
                                {imageName}
                            </Text>
                        </div>
                    )}

                    {/* Keyboard Shortcuts Help */}
                    {imageLoaded && (
                        <div style={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: 6,
                            backdropFilter: 'blur(5px)',
                            fontSize: 11,
                            lineHeight: 1.4
                        }}>
                            <div>ESC: Close</div>
                            <div>+/-: Zoom</div>
                            <div>R: Rotate</div>
                            <div>F: Fullscreen</div>
                            <div>0: Reset</div>
                        </div>
                    )}
                </div>
            )}

            {/* Error State */}
            {!loading && !imageLoaded && imageUrl && (
                <div style={{ 
                    textAlign: 'center', 
                    color: 'white',
                    padding: 40
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
                    <Text style={{ color: 'white', fontSize: 16 }}>
                        Failed to load image
                    </Text>
                    <div style={{ marginTop: 16 }}>
                        <Button onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};
