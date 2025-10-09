import React, { useState, useEffect, useCallback } from "react";
import {
  Layout, Typography, Card, Spin, Alert, Button, Space, Modal, Progress
} from "antd";
import {
  ClearOutlined, DownloadOutlined, DashboardOutlined
} from "@ant-design/icons";

import { CategorySelector } from "../components/category/CategorySelector";
import { AttributeTable } from "../components/extraction/AttributeTable";
import { BulkActions } from "../components/extraction/BulkActions";
import { ImageModal } from "../components/ui/ImageModal";
import { UploadArea } from "../components/extraction/UploadArea";
import { useCategorySelector } from "../hooks/category/useCategorySelector";
import { useLocalStorage } from "../hooks/ui/useLocalStorage";
import { CategoryHelper } from "../utils/category/categoryHelpers";
import { indexedDBService } from "../services/storage/indexedDBService";
import { useImageExtraction } from "../hooks/extraction/useImageExtraction";
import { DiscoveryToggle } from "../components/discovery/DiscoveryToggle";
import { DiscoveryDetailModal } from "../components/discovery/DiscoveryDetailModal";
import DiscoveryPanel from "../components/discovery/DiscoveryPanel";
import ExportManager from "../components/export/ExportManager";
import type { 
  DiscoveredAttribute
} from "../types/extraction/ExtractionTypes";

import "../App.css";

const { Content } = Layout;
const { Title, Text } = Typography;

const ExtractionPage = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name?: string } | null>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeDiscovery, setActiveDiscovery] = useState<DiscoveredAttribute | null>(null);

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
    addImages,
    extractImageAttributes,
    removeRow,
    clearAll,
    updateRowAttribute,
    discoverySettings,
    setDiscoverySettings,
    globalDiscoveries,
    promoteDiscoveryToSchema
  } = useImageExtraction();

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
              <Card className="category-card animate-slide-down">
                <CategorySelector 
                  selectedCategory={selectedCategory}
                  onCategorySelect={handleCategorySelect}
                />
              </Card>

              <Card className="upload-card animate-slide-up">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    📸 Upload Images
                  </Title>
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
                  await addImages(fileList);
                  return false;
                }} />
              </Card>

              {extractedRows.length > 0 && (
                <Card className="table-card animate-fade-in">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>
                      📋 Extracted Data ({extractedRows.length})
                    </Title>
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
                        onClick={clearAll}
                        className="btn-danger"
                      >
                        Clear All
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
                      if (row) {
                        extractImageAttributes(row, schema, selectedCategory?.displayName);
                      }
                    }}
                    isExtracting={isExtracting}
                  />
                </Card>
              )}
            </div>

            <div className="right-panel">
              <DiscoveryPanel 
                discoveries={globalDiscoveries}
                onPromoteToSchema={(discoveryKey: string) => promoteDiscoveryToSchema(discoveryKey)}
                onViewDetails={handleDiscoveryClick}
              />
            </div>
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