import { useState } from 'react';
import { Modal, Upload, Empty } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import { AppHeader } from './components/AppHeader';
import { AttributeTable } from './components/AttributeTable';
import { Dashboard } from './components/Dashboard';
import { BulkActions } from './components/BulkActions';
import { useImageUploader } from './hooks/useImageUploader';

import 'antd/dist/reset.css';
import '@ant-design/v5-patch-for-react-19';
import './styles/ImageAnalyzer.css';

function App() {
    const [currentView, setCurrentView] = useState<'extractor' | 'dashboard'>('extractor');
    const [modalImage, setModalImage] = useState<string | null>(null);

    const {
        extractedRows,
        schema,
        isExtracting,
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

    const renderContent = () => {
        if (currentView === 'dashboard') {
            return <Dashboard extractionHistory={extractedRows} />;
        }
        
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
                                <h3 style={{ marginBottom: 4, color: '#595959' }}>No images uploaded</h3>
                                <span>Drag & drop files here or use the upload button</span>
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
                onImageClick={setModalImage}
                onReExtract={handleReExtract}
                onAddToSchema={handleAddToSchema}
                onUpload={handleBeforeUpload}
            />
        );
    };

    return (
        <div className="analyzer-layout-wrapper">
            <div className="card header-card">
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

            <main className="content-card">
                {/* FIXED: Always render both components, just hide with CSS */}
                <div style={{ display: currentView === 'extractor' ? 'block' : 'none', height: '100%' }}>
                    {renderContent()}
                </div>
                <div style={{ display: currentView === 'dashboard' ? 'block' : 'none', height: '100%' }}>
                    <Dashboard extractionHistory={extractedRows} />
                </div>
            </main>

            <BulkActions 
                selectedRowCount={selectedRowKeys.length}
                schema={schema}
                onBulkEdit={handleBulkEdit}
            />

            <Modal 
                open={!!modalImage} 
                onCancel={() => setModalImage(null)}
                footer={null} 
                width="80vw" 
                centered 
                wrapClassName="image-modal-wrapper"
                destroyOnClose
            >
                {modalImage && (
                    <img 
                        src={modalImage} 
                        alt="Enlarged garment view" 
                        style={{ width: '100%', height: 'auto' }} 
                    />
                )}
            </Modal>
        </div>
    );
}

export default App;
