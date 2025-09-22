import React from 'react';
import { PageHeader } from '@ant-design/pro-layout';
import { Button, Upload, Progress, Tooltip, Segmented, Input, Popconfirm } from 'antd';
import { UploadOutlined, ExperimentOutlined, FileExcelOutlined, BarChartOutlined, TableOutlined, ClearOutlined } from '@ant-design/icons';

import type { ExtractedRow } from '../types';
import type { RcFile } from 'antd/es/upload';
import { exportToExcel } from '../utils/exportUtils';

const { Search } = Input;

interface AppHeaderProps {
    // FIX: Updated prop type to accept a Promise
    onUpload: (file: RcFile) => Promise<boolean> | boolean;
    onExtract: () => void;
    onClearAll: () => void;
    isExtracting: boolean;
    rows: ExtractedRow[];
    progress: number;
    currentView: 'extractor' | 'dashboard';
    onViewChange: (view: 'extractor' | 'dashboard') => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = React.memo(({ onUpload, onExtract, onClearAll, isExtracting, rows, progress, currentView, onViewChange, searchTerm, onSearchChange }) => {
    
    const pendingCount = rows.filter(r => r.status === 'Pending' && r.file?.size > 0).length;
    const doneCount = rows.filter(r => r.status === 'Done').length;
    const totalCount = rows.length;

    const handleExport = () => {
        exportToExcel(rows);
    };

    return (
        <PageHeader
            ghost={false}
            title="AI Attribute Extractor"
            subTitle="Upload images to enrich product data"
            className="app-page-header"
            extra={[
                <Segmented
                    key="view-switcher"
                    options={[
                        { value: 'extractor', icon: <Tooltip title="Extractor View"><TableOutlined /></Tooltip> },
                        { value: 'dashboard', icon: <Tooltip title="Dashboard View"><BarChartOutlined /></Tooltip> },
                    ]}
                    value={currentView}
                    onChange={(value) => onViewChange(value as 'extractor' | 'dashboard')}
                />,
                <Search
                    key="search"
                    placeholder="Search attributes..."
                    allowClear
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{ width: 200, verticalAlign: 'middle' }}
                />,
                <Upload key="upload" multiple beforeUpload={onUpload} showUploadList={false} customRequest={() => {}}>
                    <Button icon={<UploadOutlined />}>Upload Images</Button>
                </Upload>,
                <Button key="extract" icon={<ExperimentOutlined />} onClick={onExtract} loading={isExtracting} disabled={pendingCount === 0} type="primary">
                    {isExtracting ? 'Extracting...' : `Extract All (${pendingCount})`}
                </Button>,
                <Button key="export" icon={<FileExcelOutlined />} onClick={handleExport} disabled={doneCount === 0}>
                    Export to Excel
                </Button>,
                <Popconfirm
                    key="clear"
                    title="Clear all rows?"
                    description="This will remove all uploaded images and extracted data."
                    onConfirm={onClearAll}
                    okText="Yes, Clear All"
                    cancelText="No"
                >
                    <Button icon={<ClearOutlined />} danger disabled={totalCount === 0}>
                        Clear All
                    </Button>
                </Popconfirm>
            ]}
        >
            {isExtracting && <Progress percent={progress} status="active" strokeColor={{ from: '#108ee9', to: '#87d068' }} />}
        </PageHeader>
    );
});
