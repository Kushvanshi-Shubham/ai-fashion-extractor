import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Card,
  Spin,
  Alert,
  Button,
  Space,
  Modal,
  Progress,
  Row,
  Col,
  Tag,
} from "antd";
import {
  PlayCircleOutlined,
  ClearOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  DashboardOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { CategorySelector } from "./components/category/CategorySelector";
import { AttributeTable } from "./components/extraction/AttributeTable";
import { BulkActions } from "./components/extraction/BulkActions";
import { ImageModal } from "./components/ui/ImageModal";
import { UploadArea } from "./components/extraction/UploadArea";
import { ExportManager } from "./components/export/ExportManager";
import { useImageUploader } from "./hooks/extraction/useImageUploader";
import { useCategorySelector } from "./hooks/category/useCategorySelector";
import { useLocalStorage } from "./hooks/ui/useLocalStorage";
import { CategoryHelper } from "./utils/category/categoryHelpers";
import { indexedDBService } from "./services/storage/indexedDBService";
import "./App.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const App: React.FC = () => {
  // Category selection state
  const { selectedCategory, handleCategorySelect, isComplete } =
    useCategorySelector();

  // Image uploading and extraction logic
  const {
    extractedRows,
    isExtracting,
    progress,
    selectedRowKeys,
    setSelectedRowKeys,
    schema,
    stats,
    handleBeforeUpload,
    handleExtractAll,
    handleAttributeChange,
    handleDeleteRow,
    handleReExtract,
    handleAddToSchema,
    handleBulkEdit,
    handleClearAll,
  } = useImageUploader(selectedCategory);

  // UI State
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    name?: string;
  } | null>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Analytics State
  const [analytics] = useLocalStorage("analytics", {
    totalExtractions: 0,
    totalTokens: 0,
    totalTime: 0,
    averageAccuracy: 0,
    sessionsToday: 0,
    lastUsed: null,
  });

  // Persist selected category
  const [persistedCategoryCode, setPersistedCategoryCode] =
    useLocalStorage<string>("selectedCategory", "");

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await indexedDBService.initialize();

        if (persistedCategoryCode) {
          const categoryConfig = CategoryHelper.getCategoryConfig(
            persistedCategoryCode
          );
          if (categoryConfig) {
            handleCategorySelect(categoryConfig);
          }
        }

        console.log("🎯 App initialized successfully");
        console.log("📊 Category stats:", CategoryHelper.getCategoryStats());
        setAppReady(true);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    };

    initializeApp();
  }, [persistedCategoryCode, handleCategorySelect]);

  useEffect(() => {
    if (selectedCategory) {
      setPersistedCategoryCode(selectedCategory.category);
    }
  }, [selectedCategory, setPersistedCategoryCode]);

  const handleImageClick = (url: string, name?: string) => {
    setSelectedImage({ url, name });
    setImageModalVisible(true);
  };

  const handleExport = () => {
    setExportModalVisible(true);
  };

  if (!appReady) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: 24,
          background: "var(--gradient-main)",
        }}
      >
        <div
          className="shimmer"
          style={{ width: 60, height: 60, borderRadius: "50%" }}
        ></div>
        <Spin size="large" />
        <Title level={3} style={{ textAlign: "center", margin: 0 }}>
          🎯 Initializing AI Fashion System
        </Title>
        <Text type="secondary">Setting up 283 categories...</Text>
        {error && (
          <Alert
            message="Initialization Error"
            description={error}
            type="error"
            showIcon
            style={{ maxWidth: 500, marginTop: 16 }}
          />
        )}
      </div>
    );
  }

  // ✅ FIX: Add proper category change handler
const handleCategoryChange = (): void => {
  // Clear current selection and go back to category selection
  handleCategorySelect(null);  // Reset category
  setSelectedRowKeys([]);      // Clear selected rows
  handleClearAll();            // Clear all extraction data
};


  return (
    <Layout style={{ minHeight: "100vh", background: "transparent" }}>
      {/* Header */}
      <Header className="app-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <Title className="app-title">
                🎯 AI Fashion Attribute Extractor
              </Title>
              {selectedCategory && (
                <Tag className="selection-badge">
                  <CheckCircleOutlined /> {selectedCategory.displayName}
                </Tag>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<DashboardOutlined />}
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="btn-secondary"
              >
                Analytics
              </Button>

              {extractedRows.length > 0 && (
                <>
                  <Button
                    className="btn-primary-red"
                    icon={<DownloadOutlined />}
                    onClick={handleExport}
                    disabled={
                      extractedRows.filter((r) => r.status === "Done")
                        .length === 0
                    }
                  >
                    Export (
                    {extractedRows.filter((r) => r.status === "Done").length})
                  </Button>

                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleClearAll}
                    className="btn-secondary"
                  >
                    Clear All
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Header>

      {/* Main Content */}
      <Content className="app-content">
        <div className="content-wrapper">
          {/* Analytics Dashboard */}
          {showAnalytics && (
            <div className="stats-dashboard animate-slide-up">
              <div className="stat-card">
                <div className="stat-number">{analytics.totalExtractions}</div>
                <div className="stat-label">
                  <TrophyOutlined /> Total Extractions
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {analytics.totalTokens.toLocaleString()}
                </div>
                <div className="stat-label">🎯 Tokens Used</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {Math.round(analytics.totalTime / 1000)}s
                </div>
                <div className="stat-label">
                  <ClockCircleOutlined /> Processing Time
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{analytics.averageAccuracy}%</div>
                <div className="stat-label">📊 Avg Accuracy</div>
              </div>
            </div>
          )}

          {/* Phase 1: Category Selection */}
          {!isComplete && (
            <Card className="selection-card animate-fade-in">
              <CategorySelector
                onCategorySelect={handleCategorySelect}
                selectedCategory={selectedCategory}
              />
            </Card>
          )}

          {/* Phase 2: Full-Width Extraction Interface */}
          {isComplete && selectedCategory && (
            <div className="extraction-interface animate-slide-up">
              {/* Header */}
<div className="extraction-header">
  <Row justify="space-between" align="middle">
    <Col>
      <Title level={2} style={{ margin: 0, color: 'var(--text-dark)' }}>
        {selectedCategory.displayName} - AI Extraction
      </Title>
      <Text style={{ color: 'var(--text-light)' }}>
        Ready to analyze {schema.length} attributes with advanced AI
      </Text>
    </Col>
    <Col>
      <Button 
        onClick={handleCategoryChange}  // ✅ FIX: Proper handler
        className="btn-secondary"
        icon={<ArrowRightOutlined />}
      >
        Change Category
      </Button>
    </Col>
  </Row>
</div>


              {/* Body */}
              <div className="extraction-body">
                {/* Quick Stats */}
                {extractedRows.length > 0 && (
                  <div className="stats-dashboard">
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
                      <div className="stat-number">
                        {Math.round(stats.successRate)}%
                      </div>
                      <div className="stat-label">Success Rate</div>
                    </div>
                  </div>
                )}

                {/* Upload Area */}
                <div className="upload-area-enhanced">
                  <UploadArea
                    onUpload={handleBeforeUpload}
                    selectedCategory={selectedCategory}
                    disabled={isExtracting}
                  />
                </div>

                {/* Extraction Controls */}
                {extractedRows.length > 0 && (
                  <div className="category-summary">
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space direction="vertical" size="small">
                          <Text strong style={{ color: "var(--primary-red)" }}>
                            Ready to Process
                          </Text>
                          <Text>
                            <strong>
                              {
                                extractedRows.filter(
                                  (r) => r.status === "Pending"
                                ).length
                              }
                            </strong>{" "}
                            images •<strong> {schema.length}</strong> AI-powered
                            attributes
                          </Text>
                        </Space>
                      </Col>

                      <Col>
                        <Button
                          className="btn-primary-red"
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={handleExtractAll}
                          loading={isExtracting}
                          disabled={
                            extractedRows.filter((r) => r.status === "Pending")
                              .length === 0
                          }
                          size="large"
                        >
                          {isExtracting
                            ? "AI Processing..."
                            : `Extract All (${
                                extractedRows.filter(
                                  (r) => r.status === "Pending"
                                ).length
                              })`}
                        </Button>
                      </Col>
                    </Row>

                    {/* Progress Bar */}
                    {isExtracting && progress > 0 && (
                      <div className="progress-enhanced">
                        <Progress
                          percent={Math.round(progress)}
                          status="active"
                          strokeColor={{
                            from: "#ff8a80",
                            to: "#ff5722",
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Bulk Actions */}
                {selectedRowKeys.length > 0 && schema.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <BulkActions
                      selectedRowKeys={selectedRowKeys}
                      selectedRowCount={selectedRowKeys.length}
                      onBulkEdit={handleBulkEdit}
                      schema={schema}
                    />
                  </div>
                )}

                {/* Results Table */}
                {extractedRows.length > 0 && schema.length > 0 && (
                  <div className="results-table">
                    <AttributeTable
                      rows={extractedRows}
                      schema={schema}
                      selectedRowKeys={selectedRowKeys}
                      onSelectionChange={setSelectedRowKeys}
                      onAttributeChange={handleAttributeChange}
                      onDeleteRow={handleDeleteRow}
                      onImageClick={handleImageClick}
                      onReExtract={handleReExtract}
                      onAddToSchema={handleAddToSchema}
                      onUpload={handleBeforeUpload}
                    />
                  </div>
                )}

                {/* Empty State for Extraction */}
                {extractedRows.length === 0 && (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <Title level={3} style={{ color: "var(--text-light)" }}>
                      📸 Ready for {selectedCategory.displayName} Analysis
                    </Title>
                    <Text style={{ color: "var(--text-light)" }}>
                      Upload images above to start AI-powered attribute
                      extraction
                    </Text>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State for Category Selection */}
          {!selectedCategory && (
            <Card className="selection-card">
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <Title level={2} style={{ color: "var(--primary-red)" }}>
                  👕 Select Your Fashion Category
                </Title>
                <Text style={{ fontSize: 16, color: "var(--text-light)" }}>
                  Choose from{" "}
                  <strong>{CategoryHelper.getCategoryStats().total}</strong>{" "}
                  AI-powered categories
                </Text>
              </div>
            </Card>
          )}
        </div>
      </Content>

      {/* Modals */}
      <ImageModal
        visible={imageModalVisible}
        onCancel={() => setImageModalVisible(false)}
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
          data={extractedRows.filter((row) => row.status === "Done")}
          schema={schema}
          categoryName={selectedCategory?.displayName}
          onClose={() => setExportModalVisible(false)}
        />
      </Modal>
    </Layout>
  );
};

export default App;
