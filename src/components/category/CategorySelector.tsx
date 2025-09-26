import React from 'react';
import { Select, Card, Typography, Tag, Button } from 'antd';
import { ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { CategoryConfig } from '../../types/category/CategoryTypes';
import { useCategorySelector } from '../../hooks/category/useCategorySelector';
import { SchemaGenerator } from '../../utils/extraction/schemaGenerator';

const { Title, Text } = Typography;
const { Option } = Select;

interface CategorySelectorProps {
  onCategorySelect: (category: CategoryConfig | null) => void; // ✅ FIX: Allow null
  selectedCategory?: CategoryConfig | null;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  onCategorySelect,
  selectedCategory
}) => {
  // ✅ FIX: Use the correct hook (only one implementation)
  const {
    selectedDepartment,
    selectedSubDepartment,
    departments,
    subDepartments,
    availableCategories,
    handleDepartmentChange,
    handleSubDepartmentChange,
    resetSelection,
    isComplete
  } = useCategorySelector();

  // ✅ Handle category selection properly with null check
  const handleCategorySelectInternal = (categoryCode: string) => {
    const category = availableCategories.find(c => c.category === categoryCode);
    if (category) {
      onCategorySelect(category);
    }
  };

  const generateSchemaPreview = (category: CategoryConfig) => {
    const schema = SchemaGenerator.generateSchemaForCategory(category);
    return schema.length;
  };

  if (isComplete && selectedCategory) {
    return (
      <Card className="category-summary" style={{ borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#667eea' }}>
              {selectedCategory.displayName}
            </Title>
            <Text type="secondary">
              {selectedCategory.department} → {selectedCategory.subDepartment}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Tag color="blue" className="selection-badge">
                {generateSchemaPreview(selectedCategory)} Attributes Ready
              </Tag>
            </div>
          </div>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => {
              resetSelection();
              onCategorySelect(null);
            }}
            className="btn-secondary"
          >
            Change Category
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <span style={{ color: '#667eea', fontWeight: 600 }}>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          Select Fashion Category
        </span>
      } 
      className="category-selector"
      style={{ borderRadius: 12 }}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Department Selection */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            1. Choose Department
          </Text>
          <Select
            placeholder="Select department (Kids, Ladies, Mens)"
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            style={{ width: '100%' }}
            size="large"
            allowClear
          >
            {departments.map(dept => (
              <Option key={dept} value={dept}>
                {dept}
              </Option>
            ))}
          </Select>
        </div>

        {/* Sub-Department Selection */}
        {selectedDepartment && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              2. Choose Sub-Department
            </Text>
            <Select
              placeholder="Select sub-department"
              value={selectedSubDepartment}
              onChange={handleSubDepartmentChange}
              style={{ width: '100%' }}
              size="large"
              allowClear
            >
              {subDepartments.map(subDept => (
                <Option key={subDept} value={subDept}>
                  {subDept}
                </Option>
              ))}
            </Select>
          </div>
        )}

        {/* Category Selection */}
        {selectedDepartment && selectedSubDepartment && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              3. Choose Specific Category
            </Text>
            <Select
              placeholder="Select category"
              onChange={handleCategorySelectInternal}
              style={{ width: '100%' }}
              size="large"
              showSearch
              filterOption={(input, option) =>
                option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
              }
            >
              {availableCategories.map(category => (
                <Option key={category.category} value={category.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{category.displayName}</span>
                    <Tag  color="geekblue">
                      {generateSchemaPreview(category)} attrs
                    </Tag>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
        )}

        {availableCategories.length === 0 && selectedDepartment && selectedSubDepartment && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Text type="secondary">No categories available for this selection</Text>
          </div>
        )}
      </div>
    </Card>
  );
};
