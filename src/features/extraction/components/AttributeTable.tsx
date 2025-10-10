
import React, { useMemo } from 'react';
import { Table, Image, Tag, Button, Tooltip, Space, Dropdown } from 'antd';
import { ReloadOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ExtractedRow, SchemaItem } from '../../../shared/types/extraction/ExtractionTypes';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { AttributeCell } from './AttributeCell';
import { formatDuration, formatFileSize } from '../../../shared/utils/common/helpers';

interface AttributeTableProps {
  extractedRows: ExtractedRow[]; // 📸 Your uploaded images with data
  schema: SchemaItem[]; // 📋 List of attributes for current category
  selectedRowKeys: React.Key[]; // ✅ Which rows are selected (checkboxes)
  onSelectionChange: (selectedRowKeys: React.Key[]) => void; // When user selects rows
  onAttributeChange: (rowId: string, attributeKey: string, value: string | number | null) => void; // When user edits attribute
  onDeleteRow: (rowId: string) => void; // When user deletes a row
  onImageClick: (imageUrl: string, imageName?: string) => void; // When user clicks image to view
  onReExtract: (rowId: string) => void; // When user wants to re-run AI extraction
  onAddToSchema?: (attributeKey: string, value: string) => void; // When user adds new value to schema
  isExtracting?: boolean; // Whether AI is currently working
}

export const AttributeTable: React.FC<AttributeTableProps> = ({
  extractedRows,
  schema,
  selectedRowKeys,
  onSelectionChange,
  onAttributeChange,
  onDeleteRow,
  onImageClick,
  onReExtract,
  onAddToSchema
}) => {
  // 🏗️ BUILD TABLE COLUMNS DYNAMICALLY
  const columns: ColumnsType<ExtractedRow> = useMemo(() => {
    // 1️⃣ FIXED COLUMNS (always show these)
    const baseColumns: ColumnsType<ExtractedRow> = [
      // 📸 IMAGE COLUMN
      {
        title: 'Image',
        key: 'image',
        width: 100,
        fixed: 'left', // Always visible on left
        render: (_, record) => (
          <div style={{ textAlign: 'center' }}>
            {/* Show thumbnail image */}
            <Image
              src={record.imagePreviewUrl}
              alt={record.originalFileName}
              width={60}
              height={60}
              style={{ objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }}
              onClick={() => onImageClick(record.imagePreviewUrl, record.originalFileName)}
              preview={false}
            />
            {/* Show file size below image */}
            <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
              {formatFileSize(record.file.size)}
            </div>
          </div>
        ),
      },
      
      // 🔄 STATUS COLUMN
      {
        title: 'Status',
        key: 'status',
        width: 120,
        fixed: 'left', // Always visible on left
        render: (_, record) => (
          <div>
            {/* Show status badge (Pending/Done/Error/Extracting) */}
            <StatusBadge status={record.status} />
            
            {/* Show how long extraction took */}
            {record.extractionTime && (
              <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
                {formatDuration(record.extractionTime)}
              </div>
            )}
            
            {/* Show error message if extraction failed */}
            {record.error && (
              <Tooltip title={record.error}>
                <div style={{ fontSize: 10, color: '#f5222d', marginTop: 4, cursor: 'pointer' }}>
                  Click to see error
                </div>
              </Tooltip>
            )}
          </div>
        ),
      },
    ];

    // 2️⃣ DYNAMIC ATTRIBUTE COLUMNS (changes based on category)
    // For each attribute in the schema, create a column
    const attributeColumns: ColumnsType<ExtractedRow> = schema.map(schemaItem => ({
      title: (
        <div>
          {/* Column header shows attribute name */}
          <div>{schemaItem.label}</div>
          {/* Show "Required" tag if mandatory */}
          {schemaItem.required && <Tag  color="red">Required</Tag>}
        </div>
      ),
      key: schemaItem.key,
      width: 180, // 📏 Updated width for better mobile experience
      render: (_, record) => (
        // 🎯 This is where AttributeCell component shows the actual value
        <AttributeCell
          attribute={record.attributes[schemaItem.key]} // Current value
          schemaItem={schemaItem} // Schema definition
          onChange={(value) => onAttributeChange(record.id, schemaItem.key, value)} // Save changes
          onAddToSchema={(value) => onAddToSchema?.(schemaItem.key, value)} // Add new values
          disabled={record.status === 'Extracting'} // Disable if AI is working
        />
      )
    }));

    // 3️⃣ ACTIONS COLUMN (always on the right)
    const actionsColumn: ColumnsType<ExtractedRow> = [
      {
        title: 'Actions',
        key: 'actions',
        width: 120,
        fixed: 'right', // Always visible on right
        render: (_, record) => (
          <Space direction="vertical" size="small">
            {/* 👁️ View Image Button */}
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => onImageClick(record.imagePreviewUrl, record.originalFileName)}
            />
            
            {/* 🔄 Re-extract Button */}
            <Button
              type="text"
              icon={<ReloadOutlined />}
              size="small"
              onClick={() => onReExtract(record.id)}
              disabled={record.status === 'Extracting'}
            />
            
            {/* 🗑️ Delete Button (in dropdown menu) */}
            <Dropdown
              menu={{
                items: [{
                  key: 'delete',
                  label: 'Delete Row',
                  danger: true,
                  onClick: () => onDeleteRow(record.id)
                }]
              }}
              trigger={['click']}
            >
              <Button type="text" icon={<MoreOutlined />} size="small" />
            </Dropdown>
          </Space>
        ),
      },
    ];

    // 🔗 COMBINE ALL COLUMNS: Fixed Left + Dynamic Attributes + Fixed Right
    return [...baseColumns, ...attributeColumns, ...actionsColumn];
  }, [schema, onAttributeChange, onAddToSchema, onDeleteRow, onImageClick, onReExtract]);

  // ✅ ROW SELECTION CONFIGURATION (checkboxes)
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectionChange,
    getCheckboxProps: (record: ExtractedRow) => ({
      disabled: record.status === 'Extracting', // Can't select if AI is working
      name: record.originalFileName,
    }),
  };

  // 🎨 RENDER THE TABLE
  return (
    <Table<ExtractedRow>
      columns={columns} // All our column definitions
      dataSource={extractedRows} // The actual data (your images)
      rowKey="id" // Unique identifier for each row
      rowSelection={rowSelection} // Checkbox functionality
      
      // 📱 RESPONSIVE SCROLLING
      scroll={{
        x: 'max-content', // Horizontal scroll for many columns
        y: 'calc(100vh - 400px)' // Vertical scroll, responsive height
      }}
      
      // 📄 PAGINATION
      pagination={{
        pageSize: 50, // Show 50 rows per page
        showSizeChanger: true, // Let user change page size
        showQuickJumper: true, // Jump to specific page
        showTotal: (total, range) => // Show "1-50 of 200 items"
          `${range[0]}-${range[1]} of ${total} items`,
      }}
      
      size="small" // Compact table for more data
      bordered // Show borders around cells
      
      // 🎨 ROW STYLING based on status
      rowClassName={(record) => {
        if (record.status === 'Error') return 'table-row-error';
        if (record.status === 'Done') return 'table-row-success';
        if (record.status === 'Extracting') return 'table-row-processing';
        return '';
      }}
      
      // 📊 SUMMARY ROW at bottom showing stats
      summary={(pageData) => {
        const stats = {
          total: pageData.length,
          done: pageData.filter(row => row.status === 'Done').length,
          error: pageData.filter(row => row.status === 'Error').length,
          pending: pageData.filter(row => row.status === 'Pending').length,
        };
        
        return (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <strong>Summary:</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <Tag color="success">Done: {stats.done}</Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <Tag color="error">Error: {stats.error}</Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3}>
                <Tag color="processing">Pending: {stats.pending}</Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                <Tag>Total: {stats.total}</Tag>
              </Table.Summary.Cell>
              
            </Table.Summary.Row>
          </Table.Summary>
        );
      }}
    />
  );
};
