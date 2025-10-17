/**
 * 🎯 Category-Attribute Matrix Viewer
 * Shows which attributes are enabled/disabled for each category in a table format
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Table,
  Input,
  Space,
  Tag,
  Typography,
  Skeleton,
  Empty,
  Switch,
  Tooltip,
  Select,
  Badge,
} from 'antd';
import { 
  TagsOutlined, 
  SearchOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getHierarchyTree } from '../../../services/adminApi';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface AttributeMapping {
  attributeKey: string;
  attributeLabel: string;
  isEnabled: boolean;
  isRequired: boolean;
  displayOrder: number;
}

interface CategoryWithAttributes {
  id: number;
  code: string;
  name: string;
  department: string;
  subDepartment: string;
  attributesCount: number;
  enabledCount: number;
  attributes: AttributeMapping[];
}

export const CategoryAttributeMatrix = () => {
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);

  // Fetch hierarchy tree with all attributes
  const { data: hierarchyData, isLoading } = useQuery({
    queryKey: ['hierarchy-tree-full'],
    queryFn: getHierarchyTree,
  });

  // Transform hierarchy data into flat category list with attributes
  const processedData: CategoryWithAttributes[] = hierarchyData?.flatMap((dept) =>
    dept.subDepartments?.flatMap((subDept) =>
      subDept.categories?.map((cat) => {
        const attributes: AttributeMapping[] = cat.attributes?.map((attr) => ({
          attributeKey: attr.attribute?.key || '',
          attributeLabel: attr.attribute?.label || '',
          isEnabled: attr.isEnabled || false,
          isRequired: attr.isRequired || false,
          displayOrder: attr.displayOrder || 0,
        })) || [];

        const enabledCount = attributes.filter(a => a.isEnabled).length;

        return {
          id: cat.id,
          code: cat.code,
          name: cat.name,
          department: dept.name,
          subDepartment: subDept.name,
          attributesCount: attributes.length,
          enabledCount,
          attributes: attributes.sort((a, b) => a.displayOrder - b.displayOrder),
        };
      }) || []
    ) || []
  ) || [];

  // Filter data
  const filteredData = processedData.filter((item) => {
    const matchesSearch = 
      item.code.toLowerCase().includes(searchText.toLowerCase()) ||
      item.name.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesDepartment = 
      departmentFilter === 'all' || item.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const mainColumns: ColumnsType<CategoryWithAttributes> = [
    {
      title: 'Category Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      fixed: 'left',
      render: (code: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>
          {code}
        </Tag>
      ),
    },
    {
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      render: (name: string) => (
        <Space>
          <TagsOutlined style={{ color: '#52c41a' }} />
          <strong>{name}</strong>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (dept: string) => <Tag color="purple">{dept}</Tag>,
    },
    {
      title: 'Sub-Department',
      dataIndex: 'subDepartment',
      key: 'subDepartment',
      width: 150,
      render: (subDept: string) => <Tag color="cyan">{subDept}</Tag>,
    },
    {
      title: 'Attributes',
      key: 'attributesStats',
      width: 150,
      align: 'center',
      render: (_: unknown, record: CategoryWithAttributes) => (
        <Space direction="vertical" size={0}>
          <Badge 
            count={record.enabledCount} 
            style={{ backgroundColor: '#52c41a' }}
            showZero
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            of {record.attributesCount}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Enabled %',
      key: 'enabledPercentage',
      width: 120,
      align: 'center',
      render: (_: unknown, record: CategoryWithAttributes) => {
        const percentage = record.attributesCount > 0 
          ? Math.round((record.enabledCount / record.attributesCount) * 100)
          : 0;
        
        let color = '#52c41a';
        if (percentage < 30) color = '#f5222d';
        else if (percentage < 60) color = '#faad14';

        return (
          <Tag color={color} style={{ minWidth: 60 }}>
            {percentage}%
          </Tag>
        );
      },
    },
  ];

  // Expanded row showing attribute details
  const expandedRowRender = (record: CategoryWithAttributes) => {
    const attributeColumns: ColumnsType<AttributeMapping> = [
      {
        title: '#',
        key: 'order',
        width: 60,
        align: 'center',
        render: (_: unknown, _record: AttributeMapping, index: number) => (
          <Text type="secondary">{index + 1}</Text>
        ),
      },
      {
        title: 'Attribute Key',
        dataIndex: 'attributeKey',
        key: 'attributeKey',
        width: 200,
        render: (key: string) => (
          <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>
            {key}
          </Tag>
        ),
      },
      {
        title: 'Attribute Label',
        dataIndex: 'attributeLabel',
        key: 'attributeLabel',
        width: 250,
      },
      {
        title: 'Status',
        key: 'status',
        width: 120,
        align: 'center',
        render: (_: unknown, attr: AttributeMapping) => (
          <Space>
            {attr.isEnabled ? (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Enabled
              </Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="default">
                Disabled
              </Tag>
            )}
          </Space>
        ),
      },
      {
        title: 'Required',
        dataIndex: 'isRequired',
        key: 'isRequired',
        width: 100,
        align: 'center',
        render: (isRequired: boolean) => (
          <Switch checked={isRequired} disabled size="small" />
        ),
      },
      {
        title: 'Display Order',
        dataIndex: 'displayOrder',
        key: 'displayOrder',
        width: 120,
        align: 'center',
        render: (order: number) => (
          <Tag color="orange">{order}</Tag>
        ),
      },
    ];

    return (
      <Table
        columns={attributeColumns}
        dataSource={record.attributes}
        pagination={false}
        size="small"
        rowKey="attributeKey"
        style={{ marginLeft: 40, marginRight: 40 }}
      />
    );
  };

  const handleExpandAll = () => {
    if (expandedRowKeys.length === filteredData.length) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(filteredData.map(item => item.id));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  return (
    <div className="category-attribute-matrix">
      <Card
        title={
          <Space>
            <TagsOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Category-Attribute Mappings
            </Title>
            <Badge 
              count={filteredData.length} 
              style={{ backgroundColor: '#1890ff' }}
              showZero
            />
          </Space>
        }
        extra={
          <Space>
            <Select
              value={departmentFilter}
              onChange={setDepartmentFilter}
              style={{ width: 150 }}
              prefix={<FilterOutlined />}
            >
              <Option value="all">All Departments</Option>
              <Option value="MENS">MENS</Option>
              <Option value="LADIES">LADIES</Option>
              <Option value="KIDS">KIDS</Option>
            </Select>
            <Search
              placeholder="Search categories..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Tooltip title={expandedRowKeys.length > 0 ? "Collapse All" : "Expand All"}>
              <Tag 
                style={{ cursor: 'pointer' }}
                color={expandedRowKeys.length > 0 ? "red" : "green"}
                onClick={handleExpandAll}
              >
                {expandedRowKeys.length > 0 ? "Collapse All" : "Expand All"}
              </Tag>
            </Tooltip>
          </Space>
        }
      >
        <Table
          columns={mainColumns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading}
          expandable={{
            expandedRowRender,
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as number[]),
          }}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} categories`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          locale={{
            emptyText: <Empty description="No categories found" />,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};
