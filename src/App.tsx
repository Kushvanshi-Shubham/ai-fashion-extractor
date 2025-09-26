import React, { useState, useEffect, useCallback } from "react";
import {
  Layout, Typography, Card, Spin, Alert, Button, Space, Modal, Row, Col, Progress, Input
} from "antd";
import {
  ClearOutlined, DownloadOutlined, ArrowRightOutlined, DashboardOutlined, PlayCircleOutlined
} from "@ant-design/icons";

import { CategorySelector } from "./components/category/CategorySelector";
import { AttributeTable } from "./components/extraction/AttributeTable";
import { BulkActions } from "./components/extraction/BulkActions";
import { ImageModal } from "./components/ui/ImageModal";
import { UploadArea } from "./components/extraction/UploadArea";
import { useCategorySelector } from "./hooks/category/useCategorySelector";
import { useLocalStorage } from "./hooks/ui/useLocalStorage";
import { CategoryHelper } from "./utils/category/categoryHelpers";
import { indexedDBService } from "./services/storage/indexedDBService";
import { useImageExtraction } from "./hooks/extraction/useImageExtraction";
import { DiscoveryToggle } from "./components/discovery/DiscoveryToggle";
import { DiscoveryDetailModal } from "./components/discovery/DiscoveryDetailModal";
import type { DiscoveredAttribute } from "./types/extraction/ExtractionTypes";

import "./App.css";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import DiscoveryPanel from "./components/discovery/DiscoveryPanel";
import ExportManager from "./components/export/ExportManager";

const { Header, Content } = Layout;
const { Title, Text } = Typography;



const App: React.FC = () => {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || "");
  const [showApiKeyModal, setShowApiKeyModal] = useState(!apiKey);
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

  const handleApiKeySubmit = useCallback(() => {
    if (apiKey.startsWith("sk-")) {
      localStorage.setItem("temp_api_key", apiKey);
      setShowApiKeyModal(false);
      window.location.reload();
    } else {
      alert("Please enter a valid OpenAI API key (starts with sk-)");
    }
  }, [apiKey]);

  const { selectedCategory, handleCategorySelect, isComplete, schema } = useCategorySelector();

  const {
    extractedRows,
    isExtracting,
    progress,
    stats,
    addImages,
    extractImageAttributes,
    extractAllPending,
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

  const handleExport = useCallback(() => setExportModalVisible(true), []);

  const handleUpload = useCallback(async (file: File, fileList: File[]) => {
    if (file === fileList[0]) {
      await addImages(fileList);
    }
    return false;
  }, [addImages]);

  const handleCategoryChange = useCallback((): void => {
    handleCategorySelect(null);
    setSelectedRowKeys([]);
    clearAll();
  }, [handleCategorySelect, clearAll]);

  const handleExtractAllClick = useCallback(() => {
    extractAllPending(schema, selectedCategory?.displayName);
  }, [extractAllPending, schema, selectedCategory]);

  const handleReExtractClick = useCallback(
    (rowId: string) => {
      const rowToReExtract = extractedRows.find((r) => r.id === rowId);
      if (rowToReExtract) {
        extractImageAttributes(rowToReExtract, schema, selectedCategory?.displayName);
      }
    },
    [extractedRows, extractImageAttributes, schema, selectedCategory]
  );

  const handleBulkEdit = useCallback(
    (attributeKey: string, value: string | number | null) => {
      selectedRowKeys.forEach((rowId) => {
        updateRowAttribute(String(rowId), attributeKey, value);
      });
    },
    [selectedRowKeys, updateRowAttribute]
  );

  // Error boundary applied at root layout level for UI robustness
  return (
    <ErrorBoundary>
      {showApiKeyModal ? (
        <div style={{ padding: 40, textAlign: "center", minHeight: "100vh" }}>
          <Modal
            title="🔑 API Key Required"
            open={showApiKeyModal}
            onOk={handleApiKeySubmit}
            onCancel={() => setShowApiKeyModal(false)}
            closable={false}
            okText="Save & Continue"
          >
            <Alert
              message="OpenAI API Key Required"
              description="This Fashion AI Extractor needs your OpenAI API key to analyze images."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Input.Password
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <Alert
              message="How to get your API key:"
              description={
                <ol style={{ textAlign: "left", paddingLeft: 16 }}>
                  <li>
                    Go to <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer">platform.openai.com</a>
                  </li>
                  <li>Create an account or sign in</li>
                  <li>Navigate to API keys section</li>
                  <li>Create a new secret key</li>
                  <li>Copy and paste it above</li>
                </ol>
              }
              type="warning"
              showIcon
            />
          </Modal>
        </div>
      ) : !appReady ? (
        <Layout style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
          <Content style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
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
          <Header className="app-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "100%" }}>
              <Title level={2} className="app-title">
                🎯 AI Fashion Extractor
              </Title>
              <Space>
                <Button
                  icon={<DashboardOutlined />}
                  onClick={() => setShowAnalytics((prev) => !prev)}
                  className={showAnalytics ? "btn-primary" : "btn-secondary"}
                >
                  Analytics
                </Button>
              </Space>
            </div>
          </Header>

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
                    <div className="stat-number">{Math.round(analytics.totalTime / 1000)}s</div>
                    <div className="stat-label">Processing Time</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{analytics.averageAccuracy}%</div>
                    <div className="stat-label">📊 Avg Accuracy</div>
                  </div>
                </div>
              )}

              {!isComplete && (
                <Card className="selection-card animate-fade-in" style={{ marginBottom: 24 }}>
                  <CategorySelector
                    onCategorySelect={handleCategorySelect}
                    selectedCategory={selectedCategory}
                  />
                </Card>
              )}

              {isComplete && selectedCategory && (
                <div className="extraction-interface animate-slide-up">
                  <div className="extraction-header">
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Title level={3} style={{ color: "white", margin: 0 }}>
                          {selectedCategory.displayName} - AI Extraction
                        </Title>
                        <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                          Ready to analyze {schema.length} attributes with advanced AI
                        </Text>
                      </Col>
                      <Col>
                        <Button
                          icon={<ArrowRightOutlined />}
                          className="btn-secondary"
                          onClick={handleCategoryChange}
                        >
                          Change Category
                        </Button>
                      </Col>
                    </Row>
                  </div>

                  <div className="extraction-body">
                    {extractedRows.length > 0 ? (
                      <>
                        <div className="stats-dashboard" style={{ marginBottom: 16 }}>
                          <div className="stat-card">
                            <div className="stat-number">{stats.total}</div>
                            <div className="stat-label">Total Images</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-number">{stats.done}</div>
                            <div className="stat-label">Completed</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-number">{stats.pending}</div>
                            <div className="stat-label">Pending</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-number">{Math.round(stats.successRate)}%</div>
                            <div className="stat-label">Success Rate</div>
                          </div>
                        </div>

                        <div className="extraction-controls">
                          <Space size="middle" wrap>
                            <Button
                              type="primary"
                              icon={<PlayCircleOutlined />}
                              size="large"
                              onClick={handleExtractAllClick}
                              disabled={(stats.pending + stats.error) === 0 || isExtracting}
                              loading={isExtracting}
                              className="btn-primary"
                            >
                              {isExtracting ? `Extracting... (${Math.round(progress)}%)` : `Extract All (${stats.pending + stats.error})`}
                            </Button>

                            {isExtracting && (
                              <Progress
                                percent={Math.round(progress)}
                                size="small"
                                style={{ minWidth: 200 }}
                                strokeColor={{ from: "#667eea", to: "#764ba2" }}
                              />
                            )}

                            <Button icon={<DownloadOutlined />} onClick={handleExport}>
                              Export Results
                            </Button>

                            <Button icon={<ClearOutlined />} onClick={clearAll} className="btn-primary-red">
                              Clear All
                            </Button>
                          </Space>

                          <Text type="secondary" style={{ marginTop: 8, display: "block" }}>
                            {stats.pending} pending • {stats.done} done • {stats.error} errors
                          </Text>
                        </div>

                        <AttributeTable
                          schema={schema}
                          extractedRows={extractedRows}
                          selectedRowKeys={selectedRowKeys}
                          onSelectionChange={setSelectedRowKeys}
                          onAttributeChange={updateRowAttribute}
                          onImageClick={handleImageClick}
                          onDeleteRow={removeRow}
                          onReExtract={handleReExtractClick}
                          isExtracting={isExtracting}
                        />

                        {selectedRowKeys.length > 0 && (
                          <BulkActions
                            schema={schema}
                            selectedRowCount={selectedRowKeys.length}
                            onBulkEdit={handleBulkEdit}
                            onClearSelection={() => setSelectedRowKeys([])}
                            selectedRowKeys={selectedRowKeys}
                          />
                        )}
                      </>
                    ) : (
                      <UploadArea onUpload={handleUpload} />
                    )}
                  </div>
                </div>
              )}

              <DiscoveryToggle
                settings={discoverySettings}
                onChange={setDiscoverySettings}
                rowsWithDiscovery={{
                  total: extractedRows.filter((r) => r.discoveryMode).length,
                }}
              />

              <DiscoveryPanel
                discoveries={globalDiscoveries}
                onPromoteToSchema={promoteDiscoveryToSchema}
                onViewDetails={setActiveDiscovery}
              />

              <DiscoveryDetailModal
                discovery={activeDiscovery}
                visible={!!activeDiscovery}
                onClose={() => setActiveDiscovery(null)}
                onPromote={promoteDiscoveryToSchema}
              />

              <ImageModal
                visible={imageModalVisible}
                onClose={() => setImageModalVisible(false)}
                imageUrl={selectedImage?.url || ""}
                imageName={selectedImage?.name}
              />

              <Modal
                title="Export Results"
                open={exportModalVisible}
                onCancel={() => setExportModalVisible(false)}
                footer={null}
                width={700}
              >
                <ExportManager
                  extractedRows={extractedRows.filter((row) => row.status === "Done")}
                  schema={schema}
                  categoryName={selectedCategory?.displayName}
                  onClose={() => setExportModalVisible(false)}
                />
              </Modal>
            </div>
          </Content>
        </Layout>
      )}
    </ErrorBoundary>
  );
};

export default App;
