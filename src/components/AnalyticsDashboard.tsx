import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Alert, Spin, Tabs, Button } from 'antd';
import { 
    DollarOutlined, 
    ClockCircleOutlined, 
    CheckCircleOutlined, 
    FileTextOutlined,
    TrophyOutlined 
} from '@ant-design/icons';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line 
} from 'recharts';
import { analyticsService } from '../services/analyticsService';
import type { 
    AttributeDistribution, 
    PerformanceInsights 
} from '../services/analyticsService';
import type { ProcessingStats, CostAnalytics } from '../services/dataService';
import type { SchemaItem } from '../types';

interface AnalyticsDashboardProps {
    schema: readonly SchemaItem[];
    isVisible: boolean;
}

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa541c'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ schema, isVisible }) => {
    const [loading, setLoading] = useState(false);
    const [basicStats, setBasicStats] = useState<ProcessingStats | null>(null);
    const [costAnalytics, setCostAnalytics] = useState<CostAnalytics | null>(null);
    const [attributeDistribution, setAttributeDistribution] = useState<AttributeDistribution[]>([]);
    const [performanceInsights, setPerformanceInsights] = useState<PerformanceInsights | null>(null);

    const loadAnalyticsData = useCallback(async () => {
        setLoading(true);
        try {
            const [stats, cost, distribution, performance] = await Promise.all([
                analyticsService.getBasicStats(),
                analyticsService.getCostBreakdown(),
                analyticsService.getAttributeDistribution(schema),
                analyticsService.getPerformanceInsights()
            ]);

            setBasicStats(stats);
            setCostAnalytics(cost);
            setAttributeDistribution(distribution);
            setPerformanceInsights(performance);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [schema]);

    useEffect(() => {
        if (isVisible) {
            loadAnalyticsData();
        }
    }, [isVisible, loadAnalyticsData]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 50 }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>Loading analytics...</p>
            </div>
        );
    }

    const overviewTab = (
        <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Images Processed"
                            value={basicStats?.totalProcessed || 0}
                            prefix={<FileTextOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Success Rate"
                            value={basicStats?.successRate || 0}
                            suffix="%"
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: basicStats && basicStats.successRate > 90 ? '#52c41a' : '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Avg Processing Time"
                            value={basicStats ? (basicStats.avgProcessingTime / 1000).toFixed(1) : 0}
                            suffix="sec"
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Total Cost"
                            value={basicStats?.totalCost || 0}
                            precision={4}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: '#f5222d' }}
                        />
                    </Card>
                </Col>
            </Row>

            {costAnalytics && (
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={12}>
                        <Card title="💰 Cost Breakdown">
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span>Daily Cost:</span>
                                    <span>${costAnalytics.dailyCost.toFixed(4)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span>Monthly Cost:</span>
                                    <span>${costAnalytics.monthlyCost.toFixed(4)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span>Cost per Image:</span>
                                    <span>${costAnalytics.costPerImage.toFixed(4)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <span><strong>Projected Monthly:</strong></span>
                                    <span><strong>${costAnalytics.projectedMonthlyCost.toFixed(2)}</strong></span>
                                </div>
                            </div>
                            
                            <h4>Token Usage:</h4>
                            <div style={{ marginBottom: 8 }}>
                                GPT-4o: {costAnalytics.tokenUsageBreakdown.gpt4o.toLocaleString()} tokens
                            </div>
                            <div>
                                GPT-4o Mini: {costAnalytics.tokenUsageBreakdown.gpt4oMini.toLocaleString()} tokens
                            </div>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="📊 Performance Insights">
                            {performanceInsights?.optimizationSuggestions.map((suggestion) => (
                                <Alert
                                    key={suggestion.title}
                                    message={suggestion.title}
                                    description={suggestion.description}
                                    type={suggestion.priority === 'high' ? 'warning' : 'info'}
                                    showIcon
                                    style={{ marginBottom: 8 }}
                                    action={
                                        <span style={{ fontSize: 12, color: '#52c41a' }}>
                                            {suggestion.potentialSaving}
                                        </span>
                                    }
                                />
                            ))}
                        </Card>
                    </Col>
                </Row>
            )}
        </div>
    );

    const distributionTab = (
        <div>
            <Row gutter={16}>
                {attributeDistribution.slice(0, 6).map((attr) => (
                    <Col span={12} key={attr.attributeKey} style={{ marginBottom: 24 }}>
                        <Card title={`${attr.label} Distribution`}>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={attr.values.slice(0, 6)}
                                        dataKey="count"
                                        nameKey="value"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        
                                                                           
                                    >
                                        {attr.values.map((_, idx) => (
                                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                        
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
                                <div>Most Common: <strong>{attr.mostCommon}</strong></div>
                                <div>Diversity Score: {attr.diversity.toFixed(2)}</div>
                                {attr.outliers.length > 0 && (
                                    <div>Outliers: {attr.outliers.join(', ')}</div>
                                )}
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );

    const performanceTab = performanceInsights && (
        <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={12}>
                    <Card title="⚡ Processing Time by Image Size">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={performanceInsights.avgTimeByImageSize}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="sizeRange" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => [`${value.toFixed(0)}ms`, 'Avg Time']} />
                                <Bar dataKey="avgTime" fill="#1890ff" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="🕐 Processing Time by Hour">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={performanceInsights.timeOfDayPerformance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => [`${value.toFixed(0)}ms`, 'Avg Time']} />
                                <Line type="monotone" dataKey="avgTime" stroke="#52c41a" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>
        </div>
    );

    const tabItems = [
        {
            key: '1',
            label: (
                <span>
                    <TrophyOutlined />
                    Overview
                </span>
            ),
            children: overviewTab,
        },
        {
            key: '2',
            label: (
                <span>
                    <FileTextOutlined />
                    Attribute Distribution
                </span>
            ),
            children: distributionTab,
        },
        {
            key: '3',
            label: (
                <span>
                    <ClockCircleOutlined />
                    Performance
                </span>
            ),
            children: performanceTab,
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0 }}>📊 Analytics Dashboard</h2>
                <Button onClick={loadAnalyticsData} loading={loading}>
                    Refresh Data
                </Button>
            </div>

            <Tabs defaultActiveKey="1" items={tabItems} />
        </div>
    );
};
