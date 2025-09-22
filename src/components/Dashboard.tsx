import React, { useMemo } from 'react';
import { Row, Col, Statistic, Card, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { ExtractedRow } from '../types';
import { DollarCircleOutlined, ClockCircleOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface DashboardProps {
    extractionHistory: ExtractedRow[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Dashboard: React.FC<DashboardProps> = ({ extractionHistory }) => {
    const processedData = useMemo(() => {
        return extractionHistory.filter(row => row.status === 'Done' && row.apiTokensUsed && row.extractionTime);
    }, [extractionHistory]);

    const stats = useMemo(() => {
        if (processedData.length === 0) {
            return { totalImages: 0, avgTime: 0, totalTokens: 0, estimatedCost: 0 };
        }
        const totalImages = processedData.length;
        const totalTokens = processedData.reduce((acc, row) => acc + (row.apiTokensUsed || 0), 0);
        const avgTime = processedData.reduce((acc, row) => acc + (row.extractionTime || 0), 0) / totalImages;
        const estimatedCost = processedData.reduce((acc, row) => {
            const costPerMillion = row.modelUsed === 'gpt-4o' ? 5 : 0.15;
            return acc + ((row.apiTokensUsed || 0) / 1000000) * costPerMillion;
        }, 0);

        return { totalImages, avgTime, totalTokens, estimatedCost };
    }, [processedData]);

    const modelUsageData = useMemo(() => {
        const usage = processedData.reduce((acc, row) => {
            const model = row.modelUsed || 'unknown';
            acc[model] = (acc[model] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(usage).map(([name, value]) => ({ name, value }));
    }, [processedData]);

    if (processedData.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Empty description="No extraction data available. Process some images to see the dashboard." />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic title="Total Images Processed" value={stats.totalImages} prefix={<CheckCircleOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic title="Average Extraction Time" value={stats.avgTime} precision={0} prefix={<ClockCircleOutlined />} suffix="ms" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic title="Total Tokens Used" value={stats.totalTokens} prefix={<ThunderboltOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic title="Estimated Cost" value={stats.estimatedCost} precision={4} prefix={<DollarCircleOutlined />} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                <Col xs={24} md={12}>
                    <Card title="AI Model Usage">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={modelUsageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                    {modelUsageData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                 <Col xs={24} md={12}>
                    <Card title="Performance Overview (Last 10 Images)">
                         <ResponsiveContainer width="100%" height={300}>
                             <BarChart data={processedData.slice(-10)}>
                                 <CartesianGrid strokeDasharray="3 3" />
                                 <XAxis dataKey="id" tickFormatter={(id) => id.substring(0, 4)} />
                                 <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Tokens', angle: -90, position: 'insideLeft' }} />
                                 <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Time (ms)', angle: -90, position: 'insideRight' }}/>
                                 <Tooltip />
                                 <Legend />
                                 <Bar yAxisId="left" dataKey="apiTokensUsed" fill="#8884d8" name="Tokens Used" />
                                 <Bar yAxisId="right" dataKey="extractionTime" fill="#82ca9d" name="Time (ms)" />
                             </BarChart>
                         </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

