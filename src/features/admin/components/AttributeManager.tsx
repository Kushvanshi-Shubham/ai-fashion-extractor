import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Collapse,
  Tag,
  Space,
  Typography,
  Skeleton,
  Empty,
  Badge,
} from 'antd';
import { BgColorsOutlined, TagOutlined } from '@ant-design/icons';
import { getMasterAttributes } from '../../../services/adminApi';
import './AttributeManager.css';

const { Title, Text } = Typography;
const { Panel } = Collapse;

export const AttributeManager = () => {
  const { data: attributes, isLoading } = useQuery({
    queryKey: ['master-attributes', true],
    queryFn: () => getMasterAttributes(true),
  });

  const getTypeColor = (type: string) => {
    const colors = {
      TEXT: 'blue',
      SELECT: 'green',
      NUMBER: 'purple',
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const totalValues = attributes?.reduce((sum, attr) => sum + (attr.allowedValues?.length || 0), 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (!attributes || attributes.length === 0) {
    return (
      <Card>
        <Empty description="No attributes found" />
      </Card>
    );
  }

  return (
    <div className="attribute-manager">
      <Card
        title={
          <Space>
            <BgColorsOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Master Attributes
            </Title>
          </Space>
        }
        extra={
          <Space size="large">
            <Text type="secondary">
              <Badge count={attributes.length} showZero color="blue" />
              <span style={{ marginLeft: 8 }}>Attributes</span>
            </Text>
            <Text type="secondary">
              <Badge count={totalValues} showZero color="green" />
              <span style={{ marginLeft: 8 }}>Values</span>
            </Text>
          </Space>
        }
      >
        <Collapse
          accordion
          bordered={false}
          className="attribute-collapse"
        >
          {attributes.map((attr) => (
            <Panel
              key={attr.id}
              header={
                <Space>
                  <Tag color={getTypeColor(attr.type)}>{attr.type}</Tag>
                  <strong>{attr.label}</strong>
                  <Text type="secondary" code>{attr.key}</Text>
                  <Badge
                    count={attr.allowedValues?.length || 0}
                    style={{ backgroundColor: '#52c41a' }}
                  />
                </Space>
              }
            >
              {attr.allowedValues && attr.allowedValues.length > 0 ? (
                <div className="attribute-values">
                  <Title level={5}>Allowed Values:</Title>
                  <div className="values-grid">
                    {attr.allowedValues.map((value) => (
                      <Card
                        key={value.id}
                        size="small"
                        className="value-card"
                        hoverable
                      >
                        <Space direction="vertical" size={4}>
                          <Space>
                            <TagOutlined style={{ color: '#52c41a' }} />
                            <Text strong>{value.fullForm}</Text>
                          </Space>
                          <Text type="secondary" code>{value.shortForm}</Text>
                        </Space>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Empty
                  description="No allowed values"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Panel>
          ))}
        </Collapse>
      </Card>
    </div>
  );
};
