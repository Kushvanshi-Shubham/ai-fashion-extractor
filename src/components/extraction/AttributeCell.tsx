import React, { useState } from 'react';
import { Input, Select, InputNumber, Tooltip, Tag, Button } from 'antd';
import { CheckOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import type { AttributeDetail, SchemaItem } from '../../types/extraction/ExtractionTypes';

const { Option } = Select;

interface AttributeCellProps {
  attribute: AttributeDetail | null | undefined;
  schemaItem: SchemaItem;
  onChange: (value: string | number | null) => void;
  onAddToSchema?: (value: string) => void;
  disabled?: boolean;
}
 
export const AttributeCell: React.FC<AttributeCellProps> = ({
  attribute,
  schemaItem,
  onChange,
  onAddToSchema,
  disabled = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string | number | null>(null);

  const handleEdit = () => {
    setEditValue(attribute?.schemaValue || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(null);
    setIsEditing(false);
  };

  const handleAddToSchema = () => {
    if (attribute?.rawValue && onAddToSchema) {
      onAddToSchema(attribute.rawValue);
    }
  };

  const renderEditControl = () => {
    if (schemaItem.type === 'select') {
      return (
        <Select
          value={editValue}
          onChange={setEditValue}
          style={{ width: '100%' }}
          size="small"
          placeholder="Select value"
          allowClear
        >
          {schemaItem.allowedValues?.map(value => (
            <Option key={value} value={value}>{value}</Option>
          ))}
        </Select>
      );
    } else if (schemaItem.type === 'number') {
      return (
        <InputNumber
          value={editValue as number}
          onChange={setEditValue}
          style={{ width: '100%' }}
          size="small"
          placeholder="Enter number"
        />
      );
    } else {
      return (
        <Input
          value={editValue as string}
          onChange={(e) => setEditValue(e.target.value)}
          size="small"
          placeholder="Enter value"
        />
      );
    }
  };

  const renderDisplayValue = () => {
    if (!attribute) {
      return (
        <div style={{ color: '#ccc', fontStyle: 'italic' }}>
          No data
        </div>
      );
    }

    const { schemaValue, rawValue, visualConfidence, mappingConfidence, isNewDiscovery } = attribute;

    if (schemaValue === null) {
      return (
        <div style={{ color: '#999', fontStyle: 'italic' }}>
          Not applicable
        </div>
      );
    }

    return (
      <div>
        <div style={{ marginBottom: 4 }}>
          <strong>{schemaValue}</strong>
          {isNewDiscovery && (
            <Tooltip title="This value is not in the predefined list">
              <Tag  color="orange" style={{ marginLeft: 4 }}>
                New
              </Tag>
            </Tooltip>
          )}
        </div>
        
        {rawValue && rawValue !== schemaValue && (
          <div style={{ fontSize: 11, color: '#666' }}>
            Raw: {rawValue}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
          <Tag  color={visualConfidence > 80 ? 'green' : visualConfidence > 60 ? 'orange' : 'red'}>
            Visual: {visualConfidence}%
          </Tag>
          <Tag  color={mappingConfidence > 80 ? 'green' : mappingConfidence > 60 ? 'orange' : 'red'}>
            Mapping: {mappingConfidence}%
          </Tag>
        </div>

        {isNewDiscovery && onAddToSchema && (
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleAddToSchema}
            style={{ padding: 0, height: 'auto', marginTop: 2 }}
          >
            Add to Schema
          </Button>
        )}
      </div>
    );
  };

  if (disabled) {
    return <div style={{ opacity: 0.5 }}>{renderDisplayValue()}</div>;
  }

  if (isEditing) {
    return (
      <div style={{ minWidth: 150 }}>
        {renderEditControl()}
        <div style={{ marginTop: 4, textAlign: 'right' }}>
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleSave}
            style={{ color: 'green' }}
          />
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={handleCancel}
            style={{ color: 'red' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleEdit}
      style={{ cursor: 'pointer', minHeight: 40, padding: 4 }}
      className="attribute-cell-display"
    >
      {renderDisplayValue()}
    </div>
  );
};
