import React, { useState, useEffect, useCallback } from "react";
import {
  Layout, Typography, Card, Spin, Alert, Button, Space, Modal, Progress
} from "antd";
import {
  ClearOutlined, DownloadOutlined, DashboardOutlined, PlayCircleOutlined
} from "@ant-design/icons";

import { CategorySelector } from "../components/CategorySelector";
import { AttributeTable } from "../components/AttributeTable";
import { BulkActions } from "../components/BulkActions";
import { ImageModal } from "../../../shared/components/ui/ImageModal";
import { UploadArea } from "../components/UploadArea";
import { useCategorySelector } from "../../../shared/hooks/category/useCategorySelector";
import { useLocalStorage } from "../../../shared/hooks/ui/useLocalStorage";
import { CategoryHelper } from "../../../shared/utils/category/categoryHelpers";
import { indexedDBService } from "../../../shared/services/storage/indexedDBService";
import { useImageExtraction } from "../../../shared/hooks/extraction/useImageExtraction";
import { DiscoveryToggle } from "../components/DiscoveryToggle";
import { DiscoveryDetailModal } from "../components/DiscoveryDetailModal";
import { DiscoveryPanel } from "../components/DiscoveryPanel";
import ExportManager from "../components/ExportManager";
import type { 
  DiscoveredAttribute
} from "../../../shared/types/extraction/ExtractionTypes";

import "../../../styles/App.css";

const { Content } = Layout;
const { Title, Text } = Typography;

const ExtractionPage = () => {
  // UI State
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name?: string } | null>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeDiscovery, setActiveDiscovery] = useState<DiscoveredAttribute | null>(null);
  
  // Step Flow State
  const [currentStep, setCurrentStep] = useState<'category' | 'upload' | 'extraction'>('category');

  const [analytics] = useLocalStorage("analytics", {
    totalExtractions: 0,
    totalTokens: 0,
    totalTime: 0,
    averageAccuracy: 0,
    sessionsToday: 0,
    lastUsed: null,
  });
  const [persistedCategoryCode, setPersistedCategoryCode] = useLocalStorage("selectedCategory", "");

  const { selectedCategory, handleCategorySelect, schema } = useCategorySelector();

  const {
    extractedRows,
    isExtracting,
    progress,
    stats,
    addImages,
    extractImageAttributesWithQueue, // 🔄 Use queue-based extraction for re-extract feature
    extractAllPending,
    removeRow,
    clearAll,
    updateRowAttribute,
    discoverySettings,
    setDiscoverySettings,
    globalDiscoveries,
    promoteDiscoveryToSchema
  } = useImageExtraction();

  // Enhanced category selection handler that moves to next step
  const handleCategorySelectWithStep = useCallback((category: any) => {
    handleCategorySelect(category);
    if (category) {
      setTimeout(() => setCurrentStep('upload'), 300); // Smooth transition
    }
  }, [handleCategorySelect]);

  // Enhanced image upload handler that moves to extraction step
  const handleImagesUpload = useCallback(async (fileList: File[]) => {
    await addImages(fileList);
    if (fileList.length > 0) {
      setTimeout(() => setCurrentStep('extraction'), 500); // Smooth transition after upload
    }
  }, [addImages]);

  // Reset flow when clearing all data
  const handleClearAllWithReset = useCallback(() => {
    clearAll();
    setCurrentStep('category');
    handleCategorySelect(null);
  }, [clearAll, handleCategorySelect]);

  // Handle Extract All functionality
  const handleExtractAllClick = useCallback(() => {
    if (extractAllPending && schema && selectedCategory) {
      extractAllPending(schema, selectedCategory.displayName);
    }
  }, [extractAllPending, schema, selectedCategory]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await indexedDBService.initialize();
        if (persistedCategoryCode) {
          const categoryConfig = CategoryHelper.getCategoryConfig(persistedCategoryCode);
          if (categoryConfig) {
            handleCategorySelect(categoryConfig);
          }
        }
        setAppReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred during initialization");
      }
    };
    initializeApp();
  }, [persistedCategoryCode, handleCategorySelect]);

  useEffect(() => {
    if (selectedCategory) {
      setPersistedCategoryCode(selectedCategory.category);
    }
  }, [selectedCategory, setPersistedCategoryCode]);

  const handleImageClick = useCallback((url: string, name?: string) => {
    setSelectedImage({ url, name });
    setImageModalVisible(true);
  }, []);

  const handleRowSelection = useCallback((keys: React.Key[]) => {
    setSelectedRowKeys(keys);
  }, []);

  const handleToggleAnalytics = useCallback(() => {
    setShowAnalytics(prev => !prev);
  }, []);

  const handleDiscoveryClick = useCallback((discovery: DiscoveredAttribute) => {
    setActiveDiscovery(discovery);
  }, []);

  const handlePromoteDiscovery = useCallback((discoveryKey: string) => {
    const discovery = globalDiscoveries.find(d => d.key === discoveryKey);
    if (discovery) {
      promoteDiscoveryToSchema(discovery.key);
    }
    setActiveDiscovery(null);
  }, [promoteDiscoveryToSchema, globalDiscoveries]);

  const handleBulkEdit = useCallback((attributeKey: string, value: string | number | null) => {
    selectedRowKeys.forEach(rowKey => {
      const rowId = rowKey.toString();
      updateRowAttribute(rowId, attributeKey, value);
    });
  }, [selectedRowKeys, updateRowAttribute]);

  return !appReady ? (
    <Layout style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Content style={{ textAlign: "center" }}>
        <Card style={{ textAlign: "center", maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: 16, color: "#667eea" }}>
            🎯 Initializing AI Fashion System
          </Title>
          <Text type="secondary">
            Setting up {CategoryHelper.getCategoryStats().total} categories...
          </Text>
          {error && (
            <Alert
              message="Initialization Error"
              description={error}
              type="error"
              style={{ marginTop: 16, textAlign: "left" }}
            />
          )}
        </Card>
      </Content>
    </Layout>
  ) : (
    <Layout className="app-layout">
      <Content className="app-content">
        <div className="content-wrapper">
          {showAnalytics && (
            <div className="stats-dashboard animate-slide-up">
              <div className="stat-card">
                <div className="stat-number">{analytics.totalExtractions}</div>
                <div className="stat-label">Total Extractions</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{analytics.totalTokens.toLocaleString()}</div>
                <div className="stat-label">🎯 Tokens Used</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{(analytics.totalTime / 1000).toFixed(1)}s</div>
                <div className="stat-label">⏱️ Processing Time</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{(analytics.averageAccuracy * 100).toFixed(1)}%</div>
                <div className="stat-label">📊 Avg Accuracy</div>
              </div>
            </div>
          )}

          <div className="main-grid">
            <div className="left-panel">
              {/* Step 1: Category Selection */}
              {currentStep === 'category' && (
                <Card className="step-card" style={{ 
                  border: '2px solid #1890ff',
                  boxShadow: '0 8px 32px rgba(24, 144, 255, 0.1)' 
                }}>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={3} style={{ color: '#1890ff', marginBottom: 8 }}>
                      🎯 Step 1: Select Fashion Category
                    </Title>
                    <Text type="secondary">Choose the category that matches your images</Text>
                  </div>
                  <CategorySelector 
                    selectedCategory={selectedCategory}
                    onCategorySelect={handleCategorySelectWithStep}
                  />
                </Card>
              )}

              {/* Step 2: Image Upload */}
              {currentStep === 'upload' && (
                <Card className="step-card" style={{ 
                  border: '2px solid #52c41a',
                  boxShadow: '0 8px 32px rgba(82, 196, 26, 0.1)' 
                }}>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={3} style={{ color: '#52c41a', marginBottom: 8 }}>
                      📸 Step 2: Upload Images
                    </Title>
                    <Text type="secondary">
                      Selected: <strong>{selectedCategory?.displayName}</strong> | 
                      Upload your fashion images for AI analysis
                    </Text>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <Button 
                      onClick={() => setCurrentStep('category')}
                      type="link"
                      style={{ paddingLeft: 0 }}
                    >
                      ← Back to Category Selection
                    </Button>
                    <Space>
                      <DiscoveryToggle
                        settings={discoverySettings}
                        onChange={setDiscoverySettings}
                      />
                      <Button 
                        icon={<DashboardOutlined />}
                        onClick={handleToggleAnalytics}
                        className={showAnalytics ? "btn-primary" : "btn-secondary"}
                      >
                        Analytics
                      </Button>
                    </Space>
                  </div>
                  
                  <UploadArea onUpload={async (_file: File, fileList: File[]) => {
                    await handleImagesUpload(fileList);
                    return false;
                  }} />
                </Card>
              )}

              {/* Step 3: Extraction Results */}
              {currentStep === 'extraction' && extractedRows.length > 0 && (
                <Card className="step-card" style={{ 
                  border: '2px solid #722ed1',
                  boxShadow: '0 8px 32px rgba(114, 46, 209, 0.1)' 
                }}>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={3} style={{ color: '#722ed1', marginBottom: 8 }}>
                      🤖 Step 3: AI Extraction Results
                    </Title>
                    <Text type="secondary">
                      Category: <strong>{selectedCategory?.displayName}</strong> | 
                      {extractedRows.length} images processed
                    </Text>
                  </div>

                  {/* Stats Dashboard */}
                  {stats && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: '24px', 
                      marginBottom: 24,
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ textAlign: 'center', padding: '12px', background: '#f0f9ff', borderRadius: '8px', minWidth: '100px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>{stats.total}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Total Images</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '12px', background: '#f6ffed', borderRadius: '8px', minWidth: '100px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>{stats.done}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Completed</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '12px', background: '#fff7e6', borderRadius: '8px', minWidth: '100px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>{stats.pending}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Pending</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '12px', background: '#f9f0ff', borderRadius: '8px', minWidth: '100px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>{Math.round(stats.successRate)}%</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Success Rate</div>
                      </div>
                    </div>
                  )}

                  {/* Extract All Button */}
                  {stats && (stats.pending > 0 || stats.error > 0) && (
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        size="large"
                        onClick={handleExtractAllClick}
                        disabled={isExtracting}
                        loading={isExtracting}
                        style={{
                          background: 'linear-gradient(135deg, #722ed1 0%, #eb2f96 100%)',
                          border: 'none',
                          height: '48px',
                          fontSize: '16px',
                          fontWeight: '600',
                          paddingLeft: '32px',
                          paddingRight: '32px'
                        }}
                      >
                        {isExtracting 
                          ? `Extracting... (${Math.round(progress)}%)` 
                          : `Extract All Pending (${stats.pending + (stats.error || 0)})`
                        }
                      </Button>
                      {isExtracting && (
                        <div style={{ marginTop: 12 }}>
                          <Progress 
                            percent={Math.round(progress)} 
                            size="small" 
                            style={{ maxWidth: 300, margin: '0 auto' }}
                            strokeColor={{ from: '#722ed1', to: '#eb2f96' }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <Space>
                      <Button 
                        onClick={() => setCurrentStep('upload')}
                        type="link"
                        style={{ paddingLeft: 0 }}
                      >
                        ← Back to Upload
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep('category')}
                        type="link"
                      >
                        ← Change Category
                      </Button>
                    </Space>
                    <Space>
                      <BulkActions
                        selectedRowKeys={selectedRowKeys}
                        selectedRowCount={selectedRowKeys.length}
                        onBulkEdit={handleBulkEdit}
                        schema={schema}
                        onClearSelection={() => setSelectedRowKeys([])}
                      />
                      <Button 
                        icon={<DownloadOutlined />}
                        onClick={() => setExportModalVisible(true)}
                        className="btn-secondary"
                      >
                        Export
                      </Button>
                      <Button
                        icon={<ClearOutlined />}
                        onClick={handleClearAllWithReset}
                        className="btn-danger"
                      >
                        Start Over
                      </Button>
                    </Space>
                  </div>

                  {isExtracting && (
                    <div className="extraction-progress">
                      <Progress 
                        percent={progress} 
                        status="active" 
                        strokeColor="#667eea"
                        trailColor="#e6f3fe"
                      />
                      <div className="progress-info">
                        <Space>
                          <Text>🤖 AI Processing...</Text>
                          <Text type="secondary">({progress.toFixed(1)}%)</Text>
                        </Space>
                      </div>
                    </div>
                  )}

                  <AttributeTable
                    extractedRows={extractedRows}
                    schema={schema}
                    selectedRowKeys={selectedRowKeys}
                    onSelectionChange={handleRowSelection}
                    onAttributeChange={updateRowAttribute}
                    onDeleteRow={removeRow}
                    onImageClick={handleImageClick}
                    onReExtract={(rowId: string, forceRefresh?: boolean) => {
                      const row = extractedRows.find(r => r.id === rowId);
                      if (row && schema && selectedCategory) {
                        // Call queue-based extraction with forceRefresh flag
                        extractImageAttributesWithQueue(
                          row, 
                          schema, 
                          selectedCategory.displayName,
                          selectedCategory.department,
                          selectedCategory.subDepartment,
                          forceRefresh || false
                        );
                      }
                    }}
                    isExtracting={isExtracting}
                  />
                </Card>
              )}
            </div>

            {/* Right Panel - Show Discovery Panel only during extraction step */}
            {currentStep === 'extraction' && (
              <div className="right-panel">
                <DiscoveryPanel 
                  discoveries={globalDiscoveries}
                  onPromoteToSchema={(discoveryKey: string) => promoteDiscoveryToSchema(discoveryKey)}
                  onViewDetails={handleDiscoveryClick}
                />
              </div>
            )}
          </div>
        </div>
      </Content>

      {/* Modals */}
      <ImageModal
        visible={imageModalVisible}
        imageUrl={selectedImage?.url || ""}
        imageName={selectedImage?.name}
        onClose={() => setImageModalVisible(false)}
      />

      <Modal
        title="Export Data"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
        width={800}
      >
        <ExportManager
          extractedRows={extractedRows}
          schema={schema}
          categoryName={selectedCategory?.displayName}
          onClose={() => setExportModalVisible(false)}
        />
      </Modal>

      <DiscoveryDetailModal
        visible={!!activeDiscovery}
        discovery={activeDiscovery}
        onClose={() => setActiveDiscovery(null)}
        onPromote={handlePromoteDiscovery}
      />
    </Layout>
  );
};

export default ExtractionPage;