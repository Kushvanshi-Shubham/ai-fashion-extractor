import React, { useState, useCallback, useEffect } from 'react';
import { 
  Input, 
  Select, 
  InputNumber, 
  Badge, 
  Button, 
  Popover, 
  Space, 
  Tag,
  Typography
} from 'antd';
import { 
  EditOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  InfoCircleOutlined,
  RobotOutlined,
  PlusOutlined
} from '@ant-design/icons';
import type { AttributeDetail, SchemaItem } from '../../types/extraction/ExtractionTypes';

const { Text } = Typography;
const { Option } = Select;

interface AttributeCellProps {
  attribute?: AttributeDetail | null;
  schemaItem: SchemaItem;
  onChange: (value: string | number | null) => void;
  onAddToSchema: (value: string) => void;
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
  const [showReasoningPopover, setShowReasoningPopover] = useState(false);

  useEffect(() => {
    setEditValue(attribute?.schemaValue ?? null);
  }, [attribute?.schemaValue]);

  const handleStartEdit = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(attribute?.schemaValue ?? null);
  }, [disabled, attribute?.schemaValue]);

  const handleSaveEdit = useCallback(() => {
    onChange(editValue);
    setIsEditing(false);
  }, [editValue, onChange]);

  const handleCancelEdit = useCallback(() => {
    setEditValue(attribute?.schemaValue ?? null);
    setIsEditing(false);
  }, [attribute?.schemaValue]);

  const handleAddNewValue = useCallback((newValue: string) => {
    if (newValue.trim()) {
      onAddToSchema(newValue.trim());
      setEditValue(newValue.trim());
      onChange(newValue.trim());
      setIsEditing(false);
    }
  }, [onAddToSchema, onChange]);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return '#52c41a';
    if (confidence >= 60) return '#faad14';
    if (confidence >= 40) return '#fa8c16';
    return '#f5222d';
  };

  const renderDisplayValue = () => {
    const value = attribute?.schemaValue;
    if (value === null || value === undefined || value === '') {
      return (
        <Text 
          type="secondary" 
          italic 
          style={{ 
            fontSize: '12px',
            display: 'block',
            textAlign: 'center',
            padding: '4px 0'
          }}
        >
          No value
        </Text>
      );
    }
    return (
      <Text 
        style={{ 
          fontSize: '13px', 
          fontWeight: 500,
          display: 'block',
          wordBreak: 'break-word',
          lineHeight: '1.4',
          padding: '4px 0'
        }}
      >
        {String(value)}
      </Text>
    );
  };

  const renderEditInput = () => {
    switch (schemaItem.type) {
      case 'select':
        return (
          <Select
            value={editValue as string}
            onChange={setEditValue}
            style={{ width: '100%', minWidth: 150 }}
            size="small"
            placeholder="Select value"
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
            dropdownRender={menu => (
              <div>
                {menu}
                {schemaItem.allowedValues && (
                  <div style={{ padding: 8, borderTop: '1px solid #f0f0f0' }}>
                    <Input
                      placeholder="Add new value"
                      onPressEnter={(e) => {
                        const target = e.target as HTMLInputElement;
                        handleAddNewValue(target.value);
                        target.value = '';
                      }}
                      suffix={<PlusOutlined />}
                      size="small"
                    />
                  </div>
                )}
              </div>
            )}
          >
            {schemaItem.allowedValues?.map(value => (
              <Option key={value} value={value}>
                {value}
              </Option>
            ))}
          </Select>
        );

      case 'number':
        return (
          <InputNumber
            value={editValue as number}
            onChange={setEditValue}
            style={{ width: '100%', minWidth: 120 }}
            size="small"
            placeholder="Enter number"
          />
        );

      case 'text':
      default:
        return (
          <Input
            value={editValue as string}
            onChange={(e) => setEditValue(e.target.value)}
            style={{ width: '100%', minWidth: 120 }}
            size="small"
            placeholder="Enter text"
          />
        );
    }
  };

  const reasoningContent = (
    <div style={{ maxWidth: 300 }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div>
          <Text strong>AI Reasoning:</Text>
          <Text style={{ display: 'block', marginTop: 4, fontSize: '12px' }}>
            {attribute?.reasoning || 'No reasoning provided'}
          </Text>
        </div>
        
        <div>
          <Text strong>Raw Value:</Text>
          <Text code style={{ display: 'block', marginTop: 4, fontSize: '12px' }}>
            {attribute?.rawValue || 'null'}
          </Text>
        </div>

        <div>
          <Space size="small">
            <Tag color="blue" style={{ fontSize: '11px' }}>
              Visual: {attribute?.visualConfidence || 0}%
            </Tag>
            <Tag color="green" style={{ fontSize: '11px' }}>
              Mapping: {attribute?.mappingConfidence || 0}%
            </Tag>
          </Space>
        </div>

        {attribute?.isNewDiscovery && (
          <Tag color="orange" icon={<PlusOutlined />} style={{ fontSize: '11px' }}>
            New Discovery
          </Tag>
        )}
      </Space>
    </div>
  );

  if (isEditing) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 6, 
        minHeight: 40,
        padding: '6px'
      }}>
        <div style={{ flex: 1 }}>
          {renderEditInput()}
        </div>
        <Button
          type="text"
          size="small"
          icon={<CheckOutlined />}
          onClick={handleSaveEdit}
          style={{ color: '#52c41a' }}
        />
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={handleCancelEdit}
          style={{ color: '#f5222d' }}
        />
      </div>
    );
  }

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 50,
        padding: '8px 12px',
        borderRadius: 6,
        backgroundColor: attribute?.schemaValue ? '#fafafa' : '#f8f9fa',
        border: attribute?.schemaValue ? '1px solid #d9d9d9' : '1px solid #e8e8e8',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
      onClick={handleStartEdit}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#f0f0f0';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = attribute?.schemaValue ? '#fafafa' : '#f8f9fa';
      }}
    >
      {/* Main Content */}
      <div style={{ flex: 1, marginBottom: 4 }}>
        {renderDisplayValue()}
      </div>

      {/* Bottom Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        minHeight: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* AI Icon */}
          {attribute?.rawValue && (
            <RobotOutlined 
              style={{ 
                color: '#1890ff', 
                fontSize: 12 
              }} 
            />
          )}

          {/* Reasoning Button */}
          {attribute?.reasoning && (
            <Popover
              content={reasoningContent}
              title="Extraction Details"
              trigger="click"
              open={showReasoningPopover}
              onOpenChange={setShowReasoningPopover}
              placement="topLeft"
            >
              <Button
                type="text"
                size="small"
                icon={<InfoCircleOutlined />}
                style={{ 
                  fontSize: 11,
                  color: '#8c8c8c',
                  minWidth: 16,
                  height: 16,
                  padding: 0
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReasoningPopover(!showReasoningPopover);
                }}
              />
            </Popover>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Confidence Badge */}
          {attribute && attribute.visualConfidence > 0 && (
            <Badge
              count={`${attribute.visualConfidence}%`}
              style={{ 
                backgroundColor: getConfidenceColor(attribute.visualConfidence),
                fontSize: 10,
                height: 18,
                lineHeight: '18px',
                minWidth: 28,
                borderRadius: 9
              }}
            />
          )}

          {/* Edit Icon */}
          {!disabled && (
            <EditOutlined 
              style={{ 
                color: '#8c8c8c', 
                fontSize: 12,
                opacity: 0.6
              }} 
            />
          )}
        </div>
      </div>
    </div>
  );
};
