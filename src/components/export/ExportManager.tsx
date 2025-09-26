import React, { useState, useCallback, memo } from 'react';
import {
  Card,
  Button,
  Select,
  Space,
  Typography,
  Checkbox,
  Divider,
  notification,
  Progress
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import type { ExtractedRowEnhanced, SchemaItem } from '../../types/extraction/ExtractionTypes';

const { Text } = Typography;
const { Option } = Select;

interface ExportManagerProps {
  extractedRows: ExtractedRowEnhanced[];
  schema: SchemaItem[];
  categoryName?: string;
  onClose: () => void;
}

type ExportFormat = 'excel' | 'csv' | 'json';

interface ExportDataItem {
  [key: string]: string | number | undefined;
}

const ExportManager: React.FC<ExportManagerProps> = ({
  extractedRows,
  schema,
  categoryName,
  onClose
}) => {
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeDiscoveries, setIncludeDiscoveries] = useState(true);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(
    schema.map(item => item.key)
  );
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const prepareExportData = useCallback((): ExportDataItem[] => {
    return extractedRows.map((row, index) => {
      const baseData: ExportDataItem = {
        'Row #': index + 1,
        'Image Name': row.originalFileName,
        'Status': row.status,
        'Upload Date': row.createdAt?.toLocaleDateString()
      };

      selectedAttributes.forEach(key => {
        const schemaItem = schema.find(s => s.key === key);
        const attribute = row.attributes[key];
        baseData[schemaItem?.label || key] = attribute?.schemaValue || '';

        if (includeMetadata && attribute) {
          baseData[`${schemaItem?.label || key} (Confidence)`] = `${attribute.visualConfidence || 0}%`;
        }
      });

      if (includeMetadata) {
        baseData['Processing Time (ms)'] = row.extractionTime || 0;
        baseData['AI Model'] = row.modelUsed || 'N/A';
        baseData['Tokens Used'] = row.apiTokensUsed || 0;
      }

      if (includeDiscoveries && row.discoveries) {
        row.discoveries.forEach(discovery => {
          baseData[`Discovery: ${discovery.label}`] = discovery.normalizedValue;
        });
      }

      return baseData;
    });
  }, [extractedRows, selectedAttributes, schema, includeMetadata, includeDiscoveries]);

  const exportToExcel = useCallback(async (data: ExportDataItem[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Extraction Results');

    const fileName = `fashion-extraction-${categoryName?.replace(/\s+/g, '-') || 'results'}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [categoryName]);

  const exportToCSV = useCallback(async (data: ExportDataItem[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fileName = `fashion-extraction-${categoryName?.replace(/\s+/g, '-') || 'results'}-${new Date().toISOString().split('T')[0]}.csv`;

    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [categoryName]);

  const exportToJSON = useCallback(async (data: ExportDataItem[]) => {
    const exportObject = {
      metadata: {
        exportDate: new Date().toISOString(),
        category: categoryName,
        totalRecords: data.length,
        schema: schema.map(item => ({
          key: item.key,
          label: item.label,
          type: item.type,
          required: item.required
        }))
      },
      data
    };

    const json = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const fileName = `fashion-extraction-${categoryName?.replace(/\s+/g, '-') || 'results'}-${new Date().toISOString().split('T')[0]}.json`;

    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [categoryName, schema]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setProgress(0);

    try {
      const exportData = prepareExportData();
      setProgress(50);

      switch (format) {
        case 'excel':
          await exportToExcel(exportData);
          break;
        case 'csv':
          await exportToCSV(exportData);
          break;
        case 'json':
          await exportToJSON(exportData);
          break;
      }

      setProgress(100);
      notification.success({
        message: 'Export Successful',
        description: `Data exported as ${format.toUpperCase()} file`,
        duration: 3
      });

      setTimeout(onClose, 1000);
    } catch {
      notification.error({
        message: 'Export Failed',
        description: 'An error occurred during export',
        duration: 5
      });
    } finally {
      setExporting(false);
      setProgress(0);
    }
  }, [format, prepareExportData, exportToExcel, exportToCSV, exportToJSON, onClose]);

  const formatIcons = {
    excel: <FileExcelOutlined style={{ color: '#1B6F00' }} />,
    csv: <FileTextOutlined style={{ color: '#52c41a' }} />,
    json: <FileTextOutlined style={{ color: '#1890ff' }} />
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card size="small" title="Export Format">
        <Select
          value={format}
          onChange={setFormat}
          style={{ width: '100%' }}
          size="large"
        >
          <Option value="excel">
            <Space>{formatIcons.excel} Excel Spreadsheet (.xlsx)</Space>
          </Option>
          <Option value="csv">
            <Space>{formatIcons.csv} CSV File (.csv)</Space>
          </Option>
          <Option value="json">
            <Space>{formatIcons.json} JSON Data (.json)</Space>
          </Option>
        </Select>
      </Card>

      <Card size="small" title={`Attributes to Export (${selectedAttributes.length}/${schema.length})`}>
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          <Checkbox
            indeterminate={selectedAttributes.length > 0 && selectedAttributes.length < schema.length}
            checked={selectedAttributes.length === schema.length}
            onChange={(e) => setSelectedAttributes(e.target.checked ? schema.map(item => item.key) : [])}
            style={{ marginBottom: 8 }}
          >
            Select All Attributes
          </Checkbox>
          <Divider style={{ margin: '8px 0' }} />
          <Checkbox.Group
            value={selectedAttributes}
            onChange={setSelectedAttributes}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {schema.map(item => (
                <Checkbox key={item.key} value={item.key}>
                  <Space>
                    <Text>{item.label}</Text>
                    {item.required && <Text type="secondary" style={{ fontSize: 11 }}>(Required)</Text>}
                  </Space>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>
      </Card>

      <Card size="small" title="Export Options">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Checkbox checked={includeMetadata} onChange={(e) => setIncludeMetadata(e.target.checked)}>
            Include AI metadata (confidence scores, processing time, token usage)
          </Checkbox>
          <Checkbox checked={includeDiscoveries} onChange={(e) => setIncludeDiscoveries(e.target.checked)}>
            Include AI discoveries (additional attributes found)
          </Checkbox>
        </Space>
      </Card>

      {exporting && (
        <Progress
          percent={progress}
          status="active"
          strokeColor={{ from: '#667eea', to: '#764ba2' }}
        />
      )}

      <Card size="small" style={{ backgroundColor: '#f6f8fa' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Export Summary:</Text>
          <Text>• {extractedRows.length} images will be exported</Text>
          <Text>• {selectedAttributes.length} attributes per image</Text>
          <Text>• Format: {format.toUpperCase()}</Text>
          {includeMetadata && <Text>• AI metadata included</Text>}
          {includeDiscoveries && <Text>• Discovery data included</Text>}
        </Space>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          loading={exporting}
          onClick={handleExport}
          disabled={selectedAttributes.length === 0}
          className="btn-primary"
        >
          {exporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
        </Button>
      </div>
    </Space>
  );
};

export default memo(ExportManager);
