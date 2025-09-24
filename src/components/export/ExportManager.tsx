import React, { useState } from 'react';
import { Button, Select, Space, Typography, Alert, Card, Checkbox } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ExtractedRow, SchemaItem } from '../../types/extraction/ExtractionTypes';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { Title, Text } = Typography;

// ✅ FIX: Define proper type for export row
interface ExportRowData {
  'Row': number;
  'Image Name': string;
  'Status': string;
  'Extraction Date'?: string;
  'Processing Time (ms)'?: number;
  'AI Model'?: string;
  'Tokens Used'?: number;
  [key: string]: string | number | undefined; // For dynamic attribute columns
}

interface ExportManagerProps {
  data: ExtractedRow[];
  schema: SchemaItem[];
  categoryName?: string;
  onClose: () => void;
}

export const ExportManager: React.FC<ExportManagerProps> = ({
  data,
  schema,
  categoryName,
  onClose
}) => {
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    schema.map(item => item.key)
  );
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(schema.map(item => item.key));
  };

  const handleSelectNone = () => {
    setSelectedColumns([]);
  };

  // ✅ FIX: Properly typed export data generation
  const generateExportData = (): ExportRowData[] => {
    return data.map((row, index) => {
      const exportRow: ExportRowData = {
        'Row': index + 1,
        'Image Name': row.originalFileName,
        'Status': row.status
      };

      // Selected attributes
      selectedColumns.forEach(columnKey => {
        const schemaItem = schema.find(item => item.key === columnKey);
        const attribute = row.attributes[columnKey];
        
        if (schemaItem) {
          const attributeValue = attribute?.schemaValue;
          exportRow[schemaItem.label] = attributeValue?.toString() || '';
          
          if (includeMetadata && attribute) {
            exportRow[`${schemaItem.label}_Raw`] = attribute.rawValue || '';
            exportRow[`${schemaItem.label}_Confidence`] = attribute.visualConfidence || 0;
          }
        }
      });

      // Metadata
      if (includeMetadata) {
        exportRow['Extraction Date'] = row.updatedAt?.toISOString() || '';
        exportRow['Processing Time (ms)'] = row.extractionTime || 0;
        exportRow['AI Model'] = row.modelUsed || '';
        exportRow['Tokens Used'] = row.apiTokensUsed || 0;
      }

      return exportRow;
    });
  };

  const handleExportExcel = () => {
    try {
      const exportData = generateExportData();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(workbook, worksheet, categoryName || 'Extraction Results');
      
      const fileName = `${categoryName || 'clothing'}_extraction_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleExportCSV = () => {
    try {
      const exportData = generateExportData();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${categoryName || 'clothing'}_extraction_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleExport = () => {
    if (exportFormat === 'excel') {
      handleExportExcel();
    } else {
      handleExportCSV();
    }
    onClose();
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>Export {data.length} Extraction Results</Title>
        <Text type="secondary">
          Category: {categoryName || 'Unknown'} | 
          Available Attributes: {schema.length}
        </Text>
      </div>

      {/* Format Selection */}
      <Card title="Export Format" size="small" style={{ marginBottom: 16 }}>
        <Select
          value={exportFormat}
          onChange={setExportFormat}
          style={{ width: 200 }}
        >
          <Option value="excel">
            <FileExcelOutlined /> Excel (.xlsx)
          </Option>
          <Option value="csv">
            <FileTextOutlined /> CSV (.csv)
          </Option>
        </Select>
      </Card>

      {/* Column Selection */}
      <Card 
        title="Select Columns" 
        size="small" 
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Button size="small" onClick={handleSelectAll}>Select All</Button>
            <Button size="small" onClick={handleSelectNone}>Select None</Button>
          </Space>
        }
      >
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {schema.map(item => (
            <div key={item.key} style={{ marginBottom: 8 }}>
              <Checkbox
                checked={selectedColumns.includes(item.key)}
                onChange={() => handleColumnToggle(item.key)}
              >
                {item.label}
                {item.required && <Text type="secondary"> (Required)</Text>}
              </Checkbox>
            </div>
          ))}
        </div>
      </Card>

      {/* Options */}
      <Card title="Export Options" size="small" style={{ marginBottom: 16 }}>
        <Checkbox
          checked={includeMetadata}
          onChange={(e) => setIncludeMetadata(e.target.checked)}
        >
          Include metadata (raw values, confidence scores, processing info)
        </Checkbox>
      </Card>

      {/* Summary */}
      <Alert
        message="Export Summary"
        description={
          <div>
            <Text>• {data.length} rows will be exported</Text><br/>
            <Text>• {selectedColumns.length} attribute columns selected</Text><br/>
            <Text>• {includeMetadata ? 'With' : 'Without'} metadata columns</Text>
          </div>
        }
        type="info"
        style={{ marginBottom: 16 }}
      />

      {/* Action Buttons */}
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={selectedColumns.length === 0 || data.length === 0}
          >
            Export {exportFormat.toUpperCase()}
          </Button>
        </Space>
      </div>
    </div>
  );
};
