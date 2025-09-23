import { useState } from 'react';
import {  Upload, Empty, Tabs } from 'antd';
import { PictureOutlined, DashboardOutlined, BarChartOutlined } from '@ant-design/icons';
import { AppHeader } from './components/AppHeader';
import { AttributeTable } from './components/AttributeTable';
import { Dashboard } from './components/Dashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { BulkActions } from './components/BulkActions';
import { useImageUploader } from './hooks/useImageUploader';

import 'antd/dist/reset.css';
import '@ant-design/v5-patch-for-react-19';
import './styles/ImageAnalyzer.css';
import { ImageModal } from './components/ImageModal';

function App() {
    const [currentView, setCurrentView] = useState<'extractor' | 'dashboard' | 'analytics'>('extractor');
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [modalImageName, setModalImageName] = useState<string | undefined>(); // NEW STATE


    const {
        extractedRows,
        schema,
        isExtracting,
        isLoading,
        progress,
        selectedRowKeys,
        setSelectedRowKeys,
        searchTerm,
        setSearchTerm,
        handleBeforeUpload,
        handleExtractAll,
        handleAttributeChange,
        handleDeleteRow,
        handleReExtract,
        handleAddToSchema,
        handleBulkEdit,
        handleClearAll,
    } = useImageUploader();

    // ENHANCED: Image click handler with name
    const handleImageClick = (imageUrl: string, imageName?: string) => {
        setModalImage(imageUrl);
        setModalImageName(imageName);
    };

    // ENHANCED: Close modal handler
    const handleCloseModal = () => {
        setModalImage(null);
        setModalImageName(undefined);
    };

    // Show loading screen during initialization
    if (isLoading) {
        return (
            <div className="analyzer-layout-wrapper">
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100vh',
                    background: '#f0f2f5'
                }}>
                    <div style={{ 
                        background: '#fff', 
                        padding: 48, 
                        borderRadius: 8, 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        textAlign: 'center' 
                    }}>
                        <div style={{ 
                            width: 64, 
                            height: 64, 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '50%',
                            margin: '0 auto 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 24
                        }}>
                            🚀
                        </div>
                        <h2 style={{ margin: '0 0 8px 0', color: '#333' }}>
                            AI Attribute Extractor
                        </h2>
                        <p style={{ margin: '0 0 24px 0', color: '#666' }}>
                            Initializing your workspace...
                        </p>
                        <div style={{ 
                            width: 200, 
                            height: 4, 
                            background: '#f0f0f0',
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #1890ff, #52c41a)',
                                borderRadius: 2,
                                animation: 'loading 2s infinite'
                            }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    const renderTabContent = () => {
        switch (currentView) {
            case 'analytics':
                return <AnalyticsDashboard schema={schema} isVisible={currentView === 'analytics'} />;
            case 'dashboard':
                return <Dashboard extractionHistory={extractedRows} />;
            default:
                return renderExtractorContent();
        }
    };

    const renderExtractorContent = () => {
        const hasRows = extractedRows.length > 0;
        
        if (!hasRows && searchTerm === '') {
            return (
                <Upload.Dragger
                    name="files"
                    multiple
                    beforeUpload={handleBeforeUpload}
                    showUploadList={false}
                    customRequest={() => {}}
                    className="custom-drag-uploader"
                >
                    <Empty
                        image={<PictureOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
                        imageStyle={{ height: 80 }}
                        description={
                            <div style={{ color: '#8c8c8c' }}>
                                <h3 style={{ marginBottom: 4, color: '#595959' }}>
                                    Ready to extract clothing attributes! 👕
                                </h3>
                                <p style={{ margin: 0 }}>
                                    Drag & drop images here or use the upload button to get started
                                </p>
                                <p style={{ margin: '8px 0 0 0', fontSize: 12, opacity: 0.8 }}>
                                    Supports JPG, PNG, WebP • AI-powered attribute detection
                                </p>
                            </div>
                        }
                    />
                </Upload.Dragger>
            );
        }
return (
            <AttributeTable
                rows={extractedRows}
                schema={schema}
                selectedRowKeys={selectedRowKeys}
                onSelectionChange={setSelectedRowKeys}
                onAttributeChange={handleAttributeChange}
                onDeleteRow={handleDeleteRow}
                onImageClick={handleImageClick} // UPDATED: Now passes both URL and name
                onReExtract={handleReExtract}
                onAddToSchema={handleAddToSchema}
                onUpload={handleBeforeUpload}
            />
        );
    };
    return (
        <div className="analyzer-layout-wrapper">
            <div className="card header-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                    <div style={{ flex: 1 }}>
                        <AppHeader
                            onUpload={handleBeforeUpload}
                            onExtract={handleExtractAll}
                            isExtracting={isExtracting}
                            rows={extractedRows}
                            progress={progress}
                            currentView={currentView}
                            onViewChange={setCurrentView}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            onClearAll={handleClearAll}
                        />
                    </div>
                </div>

                {/* Enhanced Navigation Tabs */}
                <Tabs 
                    activeKey={currentView} 
                    onChange={(key) => setCurrentView(key as any)}
                    size="large"
                    style={{ marginTop: 16 }}
                    items={[
                        {
                            key: 'extractor',
                            label: (
                                <span>
                                    <PictureOutlined />
                                    Extractor {extractedRows.length > 0 && <span style={{ 
                                        background: '#52c41a', 
                                        color: 'white', 
                                        borderRadius: 10, 
                                        padding: '2px 8px', 
                                        fontSize: 12,
                                        marginLeft: 8
                                    }}>
                                        {extractedRows.length}
                                    </span>}
                                </span>
                            )
                        },
                        {
                            key: 'analytics',
                            label: (
                                <span>
                                    <BarChartOutlined />
                                    Analytics
                                    {extractedRows.filter(r => r.status === 'Done').length > 0 && 
                                        <span style={{
                                            background: '#1890ff',
                                            color: 'white',
                                            borderRadius: 10,
                                            padding: '2px 8px',
                                            fontSize: 12,
                                            marginLeft: 8
                                        }}>
                                            NEW
                                        </span>
                                    }
                                </span>
                            )
                        },
                        {
                            key: 'dashboard',
                            label: (
                                <span>
                                    <DashboardOutlined />
                                    Reports
                                </span>
                            )
                        }
                    ]}
                />
            </div>

            <main className="content-card">
                {renderTabContent()}
            </main>

            {/* Show bulk actions only on extractor tab */}
            {currentView === 'extractor' && (
                <BulkActions 
                    selectedRowCount={selectedRowKeys.length}
                    schema={schema}
                    onBulkEdit={handleBulkEdit}
                />
            )}

            <ImageModal
                visible={!!modalImage}
                imageUrl={modalImage}
                imageName={modalImageName}
                onClose={handleCloseModal}
            />
        </div>
    );
}

export default App;
