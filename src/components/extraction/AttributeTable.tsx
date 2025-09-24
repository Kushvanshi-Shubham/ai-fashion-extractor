import React, { useMemo } from 'react';
import { Table, Image, Tag, Button, Tooltip, Space, Dropdown, Menu } from 'antd';
import { DeleteOutlined, ReloadOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ExtractedRow, SchemaItem } from '../../types/extraction/ExtractionTypes';

import { StatusBadge } from '../ui/StatusBadge';
import { formatFileSize, formatDuration } from '../../utils/common/helpers';
import { AttributeCell } from './AttributeCell';

interface AttributeTableProps {
  rows: ExtractedRow[]; 
  schema: SchemaItem[];
  selectedRowKeys: React.Key[];
  onSelectionChange: (selectedRowKeys: React.Key[]) => void;
  onAttributeChange: (rowId: string, attributeKey: string, value: string | number | null) => void;
  onDeleteRow: (rowId: string) => void;
  onImageClick: (imageUrl: string, imageName?: string) => void;
  onReExtract: (rowId: string) => void;
  onAddToSchema: (attributeKey: string, value: string) => void;
  onUpload: (file: File, fileList: File[]) => Promise<boolean>;
}

export const AttributeTable: React.FC<AttributeTableProps> = ({
  rows,
  schema,
  selectedRowKeys,
  onSelectionChange,
  onAttributeChange,
  onDeleteRow,
  onImageClick,
  onReExtract,
  onAddToSchema}) => {
  const columns: ColumnsType<ExtractedRow> = useMemo(() => {
    const baseColumns: ColumnsType<ExtractedRow> = [
      {
        title: 'Image',
        key: 'image',
        width: 100,
        fixed: 'left',
        render: (_, record) => (
          <div style={{ textAlign: 'center' }}>
            <Image
              src={record.imagePreviewUrl}
              alt={record.originalFileName}
              width={60}
              height={60}
              style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
              onClick={() => onImageClick(record.imagePreviewUrl, record.originalFileName)}
              preview={false}
            />
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
              {formatFileSize(record.file.size)}
            </div>
          </div>
        )
      },
      {
        title: 'Status',
        key: 'status',
        width: 120,
        fixed: 'left',
        render: (_, record) => (
          <div>
            <StatusBadge status={record.status} />
            {record.extractionTime && (
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                {formatDuration(record.extractionTime)}
              </div>
            )}
            {record.error && (
              <Tooltip title={record.error}>
                <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 2 }}>
                  Click to see error
                </div>
              </Tooltip>
            )}
          </div>
        )
      }
    ];

    // Add dynamic attribute columns based on schema
    const attributeColumns: ColumnsType<ExtractedRow> = schema.map(schemaItem => ({
      title: (
        <div>
          <div style={{ fontWeight: 'bold' }}>{schemaItem.label}</div>
          {schemaItem.required && <Tag  color="red">Required</Tag>}
        </div>
      ),
      key: schemaItem.key,
      width: 150,
      render: (_, record) => (
        <AttributeCell
          attribute={record.attributes[schemaItem.key]}
          schemaItem={schemaItem}
          onChange={(value) => onAttributeChange(record.id, schemaItem.key, value)}
          onAddToSchema={(value) => onAddToSchema(schemaItem.key, value)}
          disabled={record.status === 'Extracting'}
        />
      )
    }));

    // Add actions column
    const actionsColumn: ColumnsType<ExtractedRow> = [
      {
        title: 'Actions',
        key: 'actions',
        width: 120,
        fixed: 'right',
        render: (_, record) => (
          <Space size="small">
            <Tooltip title="View Image">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onImageClick(record.imagePreviewUrl, record.originalFileName)}
              />
            </Tooltip>
            
            <Tooltip title="Re-extract">
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => onReExtract(record.id)}
                disabled={record.status === 'Extracting'}
              />
            </Tooltip>

            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item 
                    key="delete" 
                    icon={<DeleteOutlined />}
                    onClick={() => onDeleteRow(record.id)}
                    danger
                  >
                    Delete Row
                  </Menu.Item>
                </Menu>
              }
              trigger={['click']}
            >
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        )
      }
    ];

    return [...baseColumns, ...attributeColumns, ...actionsColumn];
  }, [schema, onAttributeChange, onAddToSchema, onDeleteRow, onImageClick, onReExtract]);

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectionChange,
    getCheckboxProps: (record: ExtractedRow) => ({
      disabled: record.status === 'Extracting',
      name: record.originalFileName,
    }),
  };

  return (
    <div className="attribute-table">
      <Table<ExtractedRow>
        columns={columns}
        dataSource={rows}
        rowKey="id"
        rowSelection={rowSelection}
        scroll={{ x: 'max-content', y: 600 }}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        size="small"
        bordered
        rowClassName={(record) => {
          if (record.status === 'Error') return 'table-row-error';
          if (record.status === 'Done') return 'table-row-success';
          if (record.status === 'Extracting') return 'table-row-processing';
          return '';
        }}
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
                <Table.Summary.Cell index={2} colSpan={schema.length + 1}>
                  <Space>
                    <Tag color="green">Done: {stats.done}</Tag>
                    <Tag color="red">Error: {stats.error}</Tag>
                    <Tag color="blue">Pending: {stats.pending}</Tag>
                    <Tag>Total: {stats.total}</Tag>
                  </Space>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </div>
  );
};
