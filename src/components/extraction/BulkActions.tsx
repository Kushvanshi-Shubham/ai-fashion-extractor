import React, { useState } from 'react';
import { Card, Select, Button, Space, Input, Typography, Tag } from 'antd';
import { EditOutlined, ClearOutlined } from '@ant-design/icons';
import type { SchemaItem } from '../../types/extraction/ExtractionTypes';

const { Option } = Select;
const { Text } = Typography;

interface BulkActionsProps {
  selectedRowKeys: React.Key[];
  selectedRowCount: number;
  onBulkEdit: (attributeKey: string, value: string | number | null) => void;
  schema: SchemaItem[];
}
 
export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedRowKeys,
  selectedRowCount,
  onBulkEdit,
  schema
}) => {
  const [selectedAttribute, setSelectedAttribute] = useState<string>('');
  const [bulkValue, setBulkValue] = useState<string | number | null>('');

  const selectedSchemaItem = schema.find(item => item.key === selectedAttribute);

  const handleBulkEdit = () => {
    if (selectedAttribute && selectedRowKeys.length > 0) {
      onBulkEdit(selectedAttribute, bulkValue);
      setBulkValue('');
    }
  };

  const handleClear = () => {
    if (selectedAttribute && selectedRowKeys.length > 0) {
      onBulkEdit(selectedAttribute, null);
    }
  };

  if (selectedRowKeys.length === 0) {
    return null;
  }

  const renderValueInput = () => {
    if (!selectedSchemaItem) return null;

    if (selectedSchemaItem.type === 'select') {
      return (
        <Select
          value={bulkValue}
          onChange={setBulkValue}
          placeholder="Select value"
          style={{ width: 200 }}
          allowClear
        >
          {selectedSchemaItem.allowedValues?.map(value => (
            <Option key={value} value={value}>{value}</Option>
          ))}
        </Select>
      );
    } else if (selectedSchemaItem.type === 'number') {
      return (
        <Input
          type="number"
          value={bulkValue as number}
          onChange={(e) => setBulkValue(Number(e.target.value))}
          placeholder="Enter number"
          style={{ width: 200 }}
        />
      );
    } else {
      return (
        <Input
          value={bulkValue as string}
          onChange={(e) => setBulkValue(e.target.value)}
          placeholder="Enter value"
          style={{ width: 200 }}
        />
      );
    }
  };

  return (
    <Card 
      size="small" 
      style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <Text strong>
            Bulk Edit: 
          </Text>
          <Tag color="blue" style={{ marginLeft: 8 }}>
            {selectedRowCount} rows selected
          </Tag>
        </div>

        <Select
          placeholder="Select attribute"
          value={selectedAttribute}
          onChange={setSelectedAttribute}
          style={{ width: 200 }}
          showSearch
          filterOption={(input, option) =>
            option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
          }
        >
          {schema.map(item => (
            <Option key={item.key} value={item.key}>
              {item.label}
            </Option>
          ))}
        </Select>

        {selectedAttribute && (
          <>
            {renderValueInput()}
            
            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleBulkEdit}
                disabled={!bulkValue && bulkValue !== 0}
              >
                Apply to {selectedRowCount} rows
              </Button>
              
              <Button
                icon={<ClearOutlined />}
                onClick={handleClear}
              >
                Clear Values
              </Button>
            </Space>
          </>
        )}
      </div>
    </Card>
  );
};
