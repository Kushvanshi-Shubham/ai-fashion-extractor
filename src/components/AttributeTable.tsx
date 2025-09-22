import React from 'react';
import { Table, Avatar, Tag, Select, Button, Tooltip, Skeleton, Space, Input, InputNumber, Empty, Popconfirm, Upload } from 'antd';
import { DeleteOutlined, InfoCircleOutlined, PictureOutlined, SyncOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ExtractedRow, SchemaItem, AttributeDetail } from '../types';
import type { RcFile } from 'antd/es/upload';

interface AttributeTableProps {
    rows: ExtractedRow[];
    schema: readonly SchemaItem[];
    selectedRowKeys: React.Key[];
    onSelectionChange: (selectedKeys: React.Key[]) => void;
    onAttributeChange: (rowId: string, key: string, value: string | number | null) => void;
    onDeleteRow: (rowId: string) => void;
    onImageClick: (imageUrl: string) => void;
    onReExtract: (rowId: string) => void;
    onAddToSchema: (key: string, value: string) => void;
    onUpload: (file: RcFile) => Promise<boolean>;
}

export const AttributeTable: React.FC<AttributeTableProps> = React.memo(({
    rows,
    schema,
    selectedRowKeys,
    onSelectionChange,
    onAttributeChange,
    onDeleteRow,
    onImageClick,
    onReExtract,
    onAddToSchema,
    onUpload,
}) => {
    
    const customEmpty = (
        <Upload.Dragger
            name="files"
            multiple
            beforeUpload={onUpload}
            showUploadList={false}
            customRequest={() => {}}
            className="custom-drag-uploader"
        >
            <Empty
                image={<PictureOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
                imageStyle={{ height: 80 }}
                description={
                    <div style={{ color: '#8c8c8c' }}>
                        <h3 style={{ marginBottom: 4, color: '#595959' }}>No images uploaded</h3>
                        <span>Drag & drop files here or use the upload button</span>
                    </div>
                }
            />
        </Upload.Dragger>
    );

    const renderEditableCell = (detail: AttributeDetail | null, record: ExtractedRow, item: SchemaItem) => {
        if (record.status !== 'Done') return <Skeleton.Input active size="small" style={{ width: '100%' }} />;
        if (!detail || typeof detail !== 'object') return null;
        
        const discoveryTooltip = detail.isNewDiscovery ? (
            <Tooltip title={
                <div>
                    <b>New Value Discovered!</b>
                    <p>AI Saw: '{detail.rawValue}' ({detail.visualConfidence}%)</p>
                    <p>Schema Match: Poor ({detail.mappingConfidence}%)</p>
                    <Popconfirm 
                        title={`Add "${detail.rawValue}" to schema?`} 
                        onConfirm={() => onAddToSchema(item.key, detail.rawValue || '')} 
                        okText="Yes, Add" 
                        cancelText="No"
                    >
                        <Button type="link" size="small">Add to Schema</Button>
                    </Popconfirm>
                </div>
            }>
                <InfoCircleOutlined style={{ color: '#faad14', marginLeft: 8, cursor: 'pointer' }} />
            </Tooltip>
        ) : null;
        
        let editorNode: React.ReactNode;
        switch (item.type) {
            case 'number': 
                editorNode = (
                    <InputNumber 
                        style={{ width: '100%' }} 
                        value={detail.schemaValue as number | null} 
                        onChange={(value) => onAttributeChange(record.id, item.key, value)} 
                    />
                ); 
                break;
            case 'text': 
                editorNode = (
                    <Input 
                        value={(detail.schemaValue as string) ?? ''} 
                        onChange={(e) => onAttributeChange(record.id, item.key, e.target.value)} 
                    />
                ); 
                break;
            default: 
                editorNode = (
                    <Select 
                        style={{ width: '100%' }} 
                        value={detail.schemaValue} 
                        onChange={(value) => onAttributeChange(record.id, item.key, value as string)} 
                        options={item.allowedValues?.map(val => ({ label: val, value: val }))} 
                        disabled={!item.allowedValues || item.allowedValues.length === 0} 
                    />
                ); 
                break;
        }
        
        return (
            <Space.Compact style={{ width: '100%' }}>
                {editorNode}
                {discoveryTooltip}
            </Space.Compact>
        );
    };

    const columns: ColumnsType<ExtractedRow> = [
        { 
            title: 'Image', 
            dataIndex: 'imagePreviewUrl', 
            key: 'image', 
            width: 80, 
            fixed: 'left', // KEEP FIXED
            render: (url: string) => (
                <Avatar 
                    shape="square" 
                    size={64} 
                    src={url} 
                    onClick={() => onImageClick(url)} 
                    style={{ cursor: 'pointer' }} 
                />
            ) 
        },
        { 
            title: 'Status', 
            dataIndex: 'status', 
            key: 'status', 
            width: 100, 
            fixed: 'left', // KEEP FIXED
            render: (status: ExtractedRow['status'], record: ExtractedRow) => { 
                if (status === 'Extracting') return <Skeleton.Input active size="small" style={{ width: '100%' }} />; 
                let color = 'default'; 
                if (status === 'Pending') color = 'gold'; 
                if (status === 'Done') color = 'success'; 
                if (status === 'Error') color = 'error'; 
                const statusNode = <Tag color={color}>{status}</Tag>; 
                return record.error ? <Tooltip title={record.error}>{statusNode}</Tooltip> : statusNode; 
            } 
        },
        // REMOVED: fixed property from schema columns - let them scroll
        ...schema.map(item => ({
            title: item.label,
            dataIndex: ['attributes', item.key],
            key: item.key,
            width: 200,
            // REMOVED: fixed property - these columns will scroll
            render: (detail: AttributeDetail | null, record: ExtractedRow) => renderEditableCell(detail, record, item),
            onCell: (record: ExtractedRow) => {
                const detail = record.attributes[item.key];
                const isDiscovery = detail?.isNewDiscovery || false;
                return {
                    className: isDiscovery ? 'new-discovery-cell' : ''
                };
            },
        })),
        { 
            title: 'Actions', 
            key: 'actions', 
            width: 100, 
            fixed: 'right', // KEEP FIXED
            render: (_: unknown, record: ExtractedRow) => (
                <Space>
                    <Tooltip title="Re-process this row">
                        <Button size="small" icon={<SyncOutlined />} onClick={() => onReExtract(record.id)} disabled={record.status === 'Extracting'} />
                    </Tooltip>
                    <Tooltip title="Delete Row">
                        <Button size="small" icon={<DeleteOutlined />} danger onClick={() => onDeleteRow(record.id)} />
                    </Tooltip>
                </Space>
            ) 
        },
    ];

    return (
        <Table
            rowSelection={{ 
                type: 'checkbox', 
                selectedRowKeys, 
                onChange: onSelectionChange,
                fixed: true // KEEP SELECTION COLUMN FIXED
            }}
            columns={columns}
            dataSource={rows}
            rowKey="id"
            bordered
            size="middle"
            scroll={{ 
                x: 1500, // SET SPECIFIC WIDTH TO TRIGGER HORIZONTAL SCROLL
                y: 'calc(100vh - 280px)'
            }}
            pagination={false}
            locale={{ emptyText: customEmpty }}
            className="attribute-table-container"
        />
    );
});
