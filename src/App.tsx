import React, { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Typography,
  Card,
  Spin,
  Alert,
  Button,
  Space,
  Modal,
  Row,
  Col,
  Tag,
  Progress,
} from "antd";
import {
  ClearOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  DashboardOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
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
  const { selectedCategory, handleCategorySelect, isComplete, schema } = useCategorySelector();

  const {
    extractedRows,
    isExtracting,
    progress,
    selectedRowKeys,
    setSelectedRowKeys,
    stats,
    handleBeforeUpload,
    handleExtractAll,
    handleAttributeChange,
    handleDeleteRow,
    handleReExtract,
    handleAddToSchema,
    handleBulkEdit,
    handleClearAll,
  } = useImageUploader();

  console.log('App.tsx schema from useCategorySelector:', schema);

  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name?: string } | null>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [analytics] = useLocalStorage("analytics", {
    totalExtractions: 0,
    totalTokens: 0,
    totalTime: 0,
    averageAccuracy: 0,
    sessionsToday: 0,
    lastUsed: null,
  });

  const [persistedCategoryCode, setPersistedCategoryCode] = useLocalStorage<string>("selectedCategory", "");

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
      } catch (error) {
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

  const handleUploadWrapper = async (_file: File, fileList: File[]): Promise<boolean> => {
    await handleBeforeUpload(fileList);
    return true;
  };

  const onSelectionChange = (keys: React.Key[]) => {
    setSelectedRowKeys(keys.map(String));
  };

  // Create handlers that pass schema
  const handleExtractAllClick = useCallback(() => {
    handleExtractAll(schema);
  }, [handleExtractAll, schema]);

  const handleReExtractClick = useCallback((rowId: string) => {
    handleReExtract(rowId, schema);
  }, [handleReExtract, schema]);

  const handleBulkEditClick = useCallback((attributeKey: string, value: string | number | null) => {
    handleBulkEdit(selectedRowKeys, { [attributeKey]: value });
  }, [handleBulkEdit, selectedRowKeys]);

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
          color: "white",
        }}
      >
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

  const handleCategoryChange = (): void => {
    handleCategorySelect(null);
    setSelectedRowKeys([]);
    handleClearAll();
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "transparent" }}>
      <Header className="app-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large" align="center">
              <Title className="app-title">🎯 AI Fashion Attribute Extractor</Title>
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
                    disabled={extractedRows.filter((r) => r.status === "Done").length === 0}
                  >
                    Export ({extractedRows.filter((r) => r.status === "Done").length})
                  </Button>

                  <Button icon={<ClearOutlined />} onClick={handleClearAll} className="btn-secondary">
                    Clear All
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Header>

      <Content className="app-content">
        <div className="content-wrapper">
          {showAnalytics && (
            <div className="stats-dashboard animate-slide-up" style={{ color: "white" }}>
              <div className="stat-card">
                <div className="stat-number">{analytics.totalExtractions}</div>
                <div className="stat-label">
                  <TrophyOutlined /> Total Extractions
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{analytics.totalTokens.toLocaleString()}</div>
                <div className="stat-label">🎯 Tokens Used</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{Math.round(analytics.totalTime / 1000)}s</div>
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

          {!isComplete && (
            <Card className="selection-card animate-fade-in" style={{ color: "white" }}>
              <CategorySelector onCategorySelect={handleCategorySelect} selectedCategory={selectedCategory} />
            </Card>
          )}

          {isComplete && selectedCategory && (
            <div className="extraction-interface animate-slide-up">
              <div className="extraction-header">
                <Row justify="space-between" align="middle">
                  <Col>
                    <Title level={2} style={{ margin: 0, color: "var(--text-dark)" }}>
                      {selectedCategory.displayName} - AI Extraction
                    </Title>
                    <Text style={{ color: "var(--text-light)" }}>
                      Ready to analyze {schema.length} attributes with advanced AI
                    </Text>
                  </Col>
                  <Col>
                    <Button onClick={handleCategoryChange} className="btn-secondary" icon={<ArrowRightOutlined />}>
                      Change Category
                    </Button>
                  </Col>
                </Row>
              </div>

              <div className="extraction-body">
                {extractedRows.length > 0 ? (
                  <>
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
                        <div className="stat-number">{Math.round(stats.successRate)}</div>
                        <div className="stat-label">Success Rate</div>
                      </div>
                    </div>

                    {/* Extract All Controls */}
                    <div className="extraction-controls" style={{ marginBottom: 24 }}>
                      <Space size="large">
                        <Button 
                          type="primary" 
                          size="large"
                          icon={<PlayCircleOutlined />}
                          onClick={handleExtractAllClick}
                          disabled={stats.pending === 0 || isExtracting}
                          loading={isExtracting}
                        >
                          {isExtracting ? `Extracting... (${Math.round(progress)}%)` : `Extract All (${stats.pending})`}
                        </Button>
                        
                        {isExtracting && (
                          <Progress 
                            percent={progress} 
                            status="active"
                            strokeColor={{ from: '#108ee9', to: '#87d068' }}
                            style={{ minWidth: 200 }}
                          />
                        )}
                        
                        <Tag color="blue">
                          {stats.pending} pending • {stats.done} done • {stats.error} errors
                        </Tag>
                      </Space>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <UploadArea onUpload={handleUploadWrapper} selectedCategory={selectedCategory} disabled={isExtracting} />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <BulkActions 
                        selectedRowKeys={selectedRowKeys} 
                        selectedRowCount={selectedRowKeys.length} 
                        onBulkEdit={handleBulkEditClick} 
                        schema={schema} 
                      />
                    </div>

                    <AttributeTable
                      rows={extractedRows}
                      schema={schema}
                      selectedRowKeys={selectedRowKeys}
                      onSelectionChange={onSelectionChange}
                      onAttributeChange={handleAttributeChange}
                      onDeleteRow={handleDeleteRow}
                      onImageClick={handleImageClick}
                      onReExtract={handleReExtractClick}
                      onAddToSchema={handleAddToSchema}
                      onUpload={handleUploadWrapper}
                    />
                  </>
                ) : (
                  <div className="upload-area">
                    <UploadArea onUpload={handleUploadWrapper} selectedCategory={selectedCategory} disabled={isExtracting} />
                  </div>
                )}
              </div>
            </div>
          )}

          {!selectedCategory && (
            <Card className="selection-card">
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <Title level={2} style={{ color: "var(--primary-red)" }}>
                  👕 Select Your Fashion Category
                </Title>
                <Text style={{ fontSize: 16, color: "var(--text-light)" }}>
                  Choose from <strong>{CategoryHelper.getCategoryStats().total}</strong> AI-powered categories
                </Text>
              </div>
            </Card>
          )}
        </div>
      </Content>

      <ImageModal visible={imageModalVisible} onClose={() => setImageModalVisible(false)} imageUrl={selectedImage?.url || ""} />

      <Modal title="Export Results" open={exportModalVisible} onCancel={() => setExportModalVisible(false)} footer={null} width={700}>
        <ExportManager data={extractedRows.filter((row) => row.status === "Done")} schema={schema} categoryName={selectedCategory?.displayName} onClose={() => setExportModalVisible(false)} />
      </Modal>
    </Layout>
  );
};

export default App;
