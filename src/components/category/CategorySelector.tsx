import React from 'react';
import { Select, Card, Typography, Tag, Button } from 'antd';
import { ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { CategoryConfig } from '../../types/category/CategoryTypes';
import { SchemaGenerator } from '../../utils/category/schemaGenerator'; 
import { useCategorySelector } from '../../hooks/category/useCategorySelector';

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

  // ✅ Handle category change
  const handleCategoryChange = (categoryCode: string): void => {
    const category = availableCategories.find(c => c.category === categoryCode);
    if (category) {
      onCategorySelect(category);
    }
  };

  // ✅ Handle reset with proper callback
  const handleResetSelection = (): void => {
    resetSelection();
    onCategorySelect(null); // ✅ FIX: Notify parent component
  };

  const selectedCategoryStats = selectedCategory 
    ? SchemaGenerator.getSchemaStats(SchemaGenerator.generateSchemaForCategory(selectedCategory))
    : null;

  // ✅ Show selected category info (when category is selected)
  if (selectedCategory) {
    return (
      <Card className="category-selector-selected">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {selectedCategory.displayName}
            </Title>
            <Text type="secondary">
              {selectedCategory.department} → {selectedCategory.category || selectedCategory.subDepartment} → {selectedCategory.category}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Tag color="blue">
                <InfoCircleOutlined /> {selectedCategoryStats?.total || 0} attributes
              </Tag>
              <Tag color="green">{selectedCategoryStats?.required || 0} required</Tag>
              <Tag color="orange">{selectedCategoryStats?.optional || 0} optional</Tag>
            </div>
          </div>
          <Button icon={<ReloadOutlined />} onClick={handleResetSelection}>
            Change Category
          </Button>
        </div>
        {selectedCategory.description && (
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            {selectedCategory.description}
          </Text>
        )}
      </Card>
    );
  }

  // ✅ Show category selection interface (when no category is selected)
  return (
    <Card title="Select Clothing Category" className="category-selector">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16 }}>
        <div>
          <Text strong>Department</Text>
          <Select
            placeholder="Select Department"
            style={{ width: '100%', marginTop: 8 }}
            value={selectedDepartment}
            onChange={handleDepartmentChange}
          >
            {departments.map(dept => (
              <Option key={dept} value={dept}>{dept}</Option>
            ))}
          </Select>
        </div>

        <div>
          <Text strong>Sub-Department</Text>
          <Select
            placeholder="Select Sub-Department"
            style={{ width: '100%', marginTop: 8 }}
            value={selectedSubDepartment}
            onChange={handleSubDepartmentChange}
            disabled={!selectedDepartment}
          >
            {subDepartments.map(subDept => (
              <Option key={subDept} value={subDept}>{subDept}</Option>
            ))}
          </Select>
        </div>

        <div>
          <Text strong>Category</Text>
          <Select
            placeholder="Select Category"
            style={{ width: '100%', marginTop: 8 }}
            onChange={handleCategoryChange}
            disabled={!selectedSubDepartment}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
            }
          >
            {availableCategories.map(category => (
              <Option key={category.category} value={category.category}>
                {category.displayName}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {availableCategories.length > 0 && !isComplete && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary">
            Choose from {availableCategories.length} available categories
          </Text>
        </div>
      )}
    </Card>
  );
};
