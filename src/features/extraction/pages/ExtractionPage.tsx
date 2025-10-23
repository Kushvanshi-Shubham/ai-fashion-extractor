import React, { useState, useEffect, useCallback } from "react";
import {
  Layout, Typography, Card, Spin, Alert, Button, Space, Modal, Progress,
  Steps, Statistic, Row, Col, Image
} from "antd";
import {
  ClearOutlined, DownloadOutlined, DashboardOutlined,
  CheckCircleOutlined, UploadOutlined, RobotOutlined, AppstoreOutlined,
  ClockCircleOutlined, DeleteOutlined
} from "@ant-design/icons";
import "./ExtractionPage.css";

import { CategorySelector } from "../components/CategorySelector";
import { AttributeTable } from "../components/AttributeTable";
import { BulkActions } from "../components/BulkActions";
import { UploadArea } from "../components";
import { useCategorySelector } from "../../../shared/hooks/category/useCategorySelector";
import { useLocalStorage } from "../../../shared/hooks/ui/useLocalStorage";
import { useCategoryConfig, useAllCategoriesAsConfigs } from "../../../hooks/useHierarchyQueries";
import { indexedDBService } from "../../../shared/services/storage/indexedDBService";
import { useImageExtraction } from "../../../shared/hooks/extraction/useImageExtraction";
import { DiscoveryToggle } from "../components/DiscoveryToggle";
import { DiscoveryDetailModal } from "../components/DiscoveryDetailModal";
import { DiscoveryPanel } from "../components/DiscoveryPanel";
import ExportManager from "../components/ExportManager";
import VLMStatusPanel from "../../../components/vlm/VLMStatusPanel";
import type { 
  DiscoveredAttribute
} from "../../../shared/types/extraction/ExtractionTypes";
import type { CategoryConfig } from "../../../shared/types/category/CategoryTypes";

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

  // Fetch persisted category from database
  const { data: persistedCategory, isLoading: isLoadingPersistedCategory } = useCategoryConfig(
    persistedCategoryCode,
    { enabled: !!persistedCategoryCode }
  );

  // Fetch all categories for stats
  const { data: allCategories = [], isLoading: isLoadingAllCategories } = useAllCategoriesAsConfigs();

  const { selectedCategory, handleCategorySelect, schema } = useCategorySelector();

  const {
    extractedRows,
    isExtracting,
    progress,
    stats,
    addImages,
    extractImageAttributes,
    extractAllPending,
    cancelExtraction,
    pauseExtraction,
    resumeExtraction,
    retryFailed,
    clearCompleted,
    isPaused,
    estimatedTimeRemaining,
    totalTokensUsed,
    removeRow,
    clearAll,
    updateRowAttribute,
    discoverySettings,
    setDiscoverySettings,
    globalDiscoveries,
    promoteDiscoveryToSchema
  } = useImageExtraction();

  // Enhanced category selection handler that moves to next step
  const handleCategorySelectWithStep = useCallback((category: CategoryConfig | null) => {
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

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await indexedDBService.initialize();
        // Wait for persisted category to load from database
        if (persistedCategoryCode && persistedCategory) {
          handleCategorySelect(persistedCategory);
        }
        setAppReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred during initialization");
      }
    };
    
    // Don't initialize until we've loaded the persisted category (if any)
    if (!persistedCategoryCode || persistedCategory || !isLoadingPersistedCategory) {
      initializeApp();
    }
  }, [persistedCategoryCode, persistedCategory, isLoadingPersistedCategory, handleCategorySelect]);

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

  return (!appReady || isLoadingAllCategories) ? (
    <Layout style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Content style={{ textAlign: "center" }}>
        <Card style={{ textAlign: "center", maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
          <Spin size="large" />
          <Title level={4} style={{ marginTop: 16, color: "#667eea" }}>
            🎯 Initializing AI Fashion System
          </Title>
          <Text type="secondary">
            {isLoadingAllCategories 
              ? "Loading categories from database..."
              : `Setting up ${allCategories.length} categories...`
            }
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
          {/* 🚀 Enhanced VLM System Status */}
          <VLMStatusPanel />

          {/* Step Indicator */}
          <Card className="steps-card" style={{ marginBottom: 24 }}>
            <Steps
              current={
                currentStep === 'category' ? 0 : 
                currentStep === 'upload' ? 1 : 2
              }
              items={[
                {
                  title: 'Select Category',
                  icon: <AppstoreOutlined />,
                  description: 'Choose fashion category'
                },
                {
                  title: 'Upload Images',
                  icon: <UploadOutlined />,
                  description: 'Add product images'
                },
                {
                  title: 'AI Extraction',
                  icon: <RobotOutlined />,
                  description: 'Extract attributes'
                }
              ]}
            />
          </Card>
          
          {showAnalytics && (
            <Card className="stats-card animate-slide-up" style={{ marginBottom: 24 }}>
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic 
                    title="Total Extractions"
                    value={analytics.totalExtractions}
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic 
                    title="Tokens Used"
                    value={analytics.totalTokens}
                    prefix={<RobotOutlined style={{ color: '#1890ff' }} />}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic 
                    title="Processing Time"
                    value={(analytics.totalTime / 1000).toFixed(1)}
                    suffix="s"
                    prefix={<DashboardOutlined style={{ color: '#fa8c16' }} />}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic 
                    title="Avg Accuracy"
                    value={(analytics.averageAccuracy * 100).toFixed(1)}
                    suffix="%"
                    prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
                  />
                </Col>
              </Row>
            </Card>
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
                    <Card className="extraction-stats-card" style={{ marginBottom: 24, background: '#fafafa' }}>
                      <Row gutter={[16, 16]}>
                        <Col xs={12} sm={6}>
                          <Statistic 
                            title="Total Images"
                            value={stats.total}
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </Col>
                        <Col xs={12} sm={6}>
                          <Statistic 
                            title="Completed"
                            value={stats.done}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<CheckCircleOutlined />}
                          />
                        </Col>
                        <Col xs={12} sm={6}>
                          <Statistic 
                            title="Pending"
                            value={stats.pending}
                            valueStyle={{ color: '#fa8c16' }}
                          />
                        </Col>
                        <Col xs={12} sm={6}>
                          <Statistic 
                            title="Success Rate"
                            value={Math.round(stats.successRate)}
                            suffix="%"
                            valueStyle={{ color: '#722ed1' }}
                          />
                        </Col>
                      </Row>

                      {/* Token Usage */}
                      {totalTokensUsed > 0 && (
                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                          <Text type="secondary">
                            ⚡ Total Tokens Used: <strong>{totalTokensUsed.toLocaleString()}</strong>
                          </Text>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Processing Status Section */}
                  {extractedRows.length > 0 && (
                    <Card 
                      title={
                        <Space>
                          <RobotOutlined style={{ color: '#722ed1' }} />
                          <span>Processing Status</span>
                        </Space>
                      }
                      style={{ marginBottom: 24 }}
                    >
                      {/* Overall Progress Bar */}
                      {(isExtracting || stats.done > 0) && (
                        <div style={{ marginBottom: 24 }}>
                          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong>Overall Progress</Text>
                            <Text type="secondary">
                              {stats.done + stats.error} / {stats.total} items
                            </Text>
                          </div>
                          <Progress
                            percent={Math.round(progress)}
                            status={
                              isExtracting ? 'active' :
                              stats.error > 0 && stats.done + stats.error === stats.total ? 'exception' :
                              stats.done === stats.total ? 'success' : 'normal'
                            }
                            strokeColor={{
                              from: '#722ed1',
                              to: '#eb2f96'
                            }}
                          />
                          
                          {/* Live Processing Info */}
                          {isExtracting && (
                            <div style={{ marginTop: 12 }}>
                              <Space size="large" wrap>
                                {stats.extracting > 0 && (
                                  <Text type="secondary">
                                    🔄 Currently processing: <strong>{stats.extracting}</strong>
                                  </Text>
                                )}
                                {totalTokensUsed > 0 && (
                                  <Text type="secondary">
                                    ⚡ Tokens: <strong>{totalTokensUsed.toLocaleString()}</strong>
                                  </Text>
                                )}
                                {estimatedTimeRemaining > 0 && (
                                  <Text type="secondary">
                                    ⏱️ Est. remaining: <strong>{Math.round(estimatedTimeRemaining)}s</strong>
                                  </Text>
                                )}
                              </Space>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Status Banner */}
                      {isExtracting && isPaused && (
                        <Alert
                          message="Batch processing is paused"
                          description="Click Resume to continue processing, or Stop to cancel."
                          type="warning"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                      )}

                      {!isExtracting && stats.done + stats.error === stats.total && stats.total > 0 && (
                        <Alert
                          message={
                            stats.error === 0 
                              ? 'Batch processing completed successfully!' 
                              : `Batch completed with ${stats.error} failed items`
                          }
                          description={
                            stats.error === 0 
                              ? `All ${stats.done} items processed successfully.`
                              : `${stats.done} succeeded, ${stats.error} failed. You can retry failed items below.`
                          }
                          type={stats.error === 0 ? 'success' : 'warning'}
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                      )}

                      {/* Action Controls */}
                      <div style={{ marginTop: 16 }}>
                        <Space wrap size="middle">
                          {/* Start/Pause/Resume/Stop */}
                          {!isExtracting && stats.pending > 0 && (
                            <Button
                              type="primary"
                              icon={<RobotOutlined />}
                              size="large"
                              onClick={() => extractAllPending && extractAllPending(schema, selectedCategory?.displayName)}
                              style={{
                                background: 'linear-gradient(135deg, #722ed1 0%, #eb2f96 100%)',
                                border: 'none'
                              }}
                            >
                              Start Batch ({stats.pending + stats.error})
                            </Button>
                          )}

                          {isExtracting && !isPaused && (
                            <Button
                              icon={<ClockCircleOutlined />}
                              size="large"
                              onClick={pauseExtraction}
                            >
                              Pause
                            </Button>
                          )}

                          {isExtracting && isPaused && (
                            <Button
                              type="primary"
                              icon={<RobotOutlined />}
                              size="large"
                              onClick={resumeExtraction}
                            >
                              Resume
                            </Button>
                          )}

                          {isExtracting && (
                            <Button
                              danger
                              icon={<ClearOutlined />}
                              size="large"
                              onClick={cancelExtraction}
                            >
                              Stop
                            </Button>
                          )}

                          {/* Batch Operations */}
                          {!isExtracting && stats.error > 0 && (
                            <Button
                              icon={<CheckCircleOutlined />}
                              onClick={retryFailed}
                            >
                              Retry Failed ({stats.error})
                            </Button>
                          )}

                          {!isExtracting && stats.done > 0 && (
                            <Button
                              icon={<DeleteOutlined />}
                              onClick={clearCompleted}
                            >
                              Clear Completed ({stats.done})
                            </Button>
                          )}
                        </Space>
                      </div>
                    </Card>
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
                    onReExtract={(rowId: string) => {
                      const row = extractedRows.find(r => r.id === rowId);
                      if (row && schema && selectedCategory) {
                        // Call direct extraction
                        extractImageAttributes(
                          row, 
                          schema, 
                          selectedCategory.displayName
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
      <Modal
        title={selectedImage?.name || "Image Preview"}
        open={imageModalVisible}
        onCancel={() => setImageModalVisible(false)}
        footer={null}
        width={800}
        centered
      >
        <div style={{ textAlign: 'center' }}>
          <Image
            src={selectedImage?.url || ""}
            alt={selectedImage?.name || "Product Image"}
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
            preview={{
              mask: 'Click to zoom',
            }}
          />
        </div>
      </Modal>

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