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
      onAddToSchema?.(newValue.trim());
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
        <Text type="secondary" style={{ fontStyle: 'italic' }}>
          No value
        </Text>
      );
    }

    return (
      <Text strong style={{ fontSize: 12 }}>
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
            style={{ width: '100%', minWidth: 120 }}
            size="small"
            showSearch
            allowClear
            placeholder="Select value"
            filterOption={(input, option) =>
              (option?.children as unknown as string)
                ?.toLowerCase()
                .includes(input.toLowerCase())
            }
            popupRender={menu => (
              <div>
                {menu}
                {schemaItem.allowedValues && onAddToSchema && (
                  <div style={{ padding: 8, borderTop: '1px solid #f0f0f0' }}>
                    <Input
                      placeholder="Add new value..."
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
            {schemaItem.allowedValues?.map((valObj) => (
              <Option
                key={valObj.shortForm}
                value={valObj.shortForm}
              >
                {`${valObj.shortForm} - ${valObj.fullForm}`}
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
    <div style={{ maxWidth: 250 }}>
      <div style={{ marginBottom: 8 }}>
        <Text strong style={{ fontSize: 12 }}>AI Reasoning:</Text>
        <div style={{ fontSize: 11, marginTop: 4 }}>
          {attribute?.reasoning || 'No reasoning provided'}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <Text strong style={{ fontSize: 12 }}>Raw Value:</Text>
        <div style={{ fontSize: 11, marginTop: 4, fontFamily: 'monospace' }}>
          {attribute?.rawValue || 'null'}
        </div>
      </div>

      <Space size="small">
        <Tag color="blue" style={{ fontSize: 10 }}>
          Visual: {attribute?.visualConfidence || 0}%
        </Tag>
        <Tag color="green" style={{ fontSize: 10 }}>
          Mapping: {attribute?.mappingConfidence || 0}%
        </Tag>
      </Space>

      {attribute?.isNewDiscovery && (
        <Tag icon={<RobotOutlined />} color="purple" style={{ fontSize: '11px', marginTop: 8 }}>
          New Discovery
        </Tag>
      )}
    </div>
  );

  if (isEditing) {
    return (
      <Space.Compact style={{ width: '100%' }}>
        {renderEditInput()}
        <Button
          type="text"
          icon={<CheckOutlined />}
          size="small"
          onClick={handleSaveEdit}
          style={{ color: '#52c41a' }}
        />
        <Button
          type="text"
          icon={<CloseOutlined />}
          size="small"
          onClick={handleCancelEdit}
          style={{ color: '#f5222d' }}
        />
      </Space.Compact>
    );
  }

  return (
    <div
      className="attribute-cell"
      style={{
        padding: 8,
        minHeight: 50,
        backgroundColor: attribute?.schemaValue ? '#fafafa' : '#f8f9fa',
        border: '1px solid #e8e8e8',
        borderRadius: 4,
        cursor: disabled ? 'default' : 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
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
      <div style={{ flex: 1 }}>
        {renderDisplayValue()}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4
      }}>
        {attribute?.rawValue && (
          <RobotOutlined style={{ fontSize: 10, color: '#667eea' }} />
        )}

        {attribute?.reasoning && (
          <Popover
            content={reasoningContent}
            title="AI Analysis"
            trigger="click"
            open={showReasoningPopover}
            onOpenChange={setShowReasoningPopover}
          >
            <Button
              type="text"
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

                {attribute && attribute.visualConfidence > 0 && (
          <Badge
            count={`${attribute.visualConfidence}%`}
            style={{
              backgroundColor: getConfidenceColor(attribute.visualConfidence),
              fontSize: 9,
              height: 14,
              minWidth: 24
            }}
          />
        )}

        {!disabled && (
          <EditOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
        )}
      </div>
    </div>
  );
};
