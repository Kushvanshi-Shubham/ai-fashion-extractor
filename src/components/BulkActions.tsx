import React, { useState } from 'react';
import { FloatButton, Modal, Select, Input, InputNumber, Button, Form, Tooltip } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { SchemaItem } from '../types';

interface BulkActionsProps {
    selectedRowCount: number;
    schema: readonly SchemaItem[];
    onBulkEdit: (attributeKey: string, value: string | number | null) => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({ selectedRowCount, schema, onBulkEdit }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedAttribute, setSelectedAttribute] = useState<SchemaItem | null>(null);
    const [form] = Form.useForm();

    if (selectedRowCount === 0) {
        return null;
    }

    const handleApply = () => {
        form.validateFields().then(values => {
            onBulkEdit(values.attribute, values.value);
            handleCancel();
        }).catch(error => {
            console.error('Form validation failed:', error);
        });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setSelectedAttribute(null);
    };

    const handleAttributeSelect = (key: string) => {
        const attribute = schema.find(item => item.key === key);
        setSelectedAttribute(attribute || null);
        form.setFieldsValue({ value: undefined }); // Reset value when attribute changes
    };

    const renderValueInput = () => {
        if (!selectedAttribute) {
            return <Input disabled placeholder="Select an attribute first" />;
        }
        
        switch (selectedAttribute.type) {
            case 'number':
                return (
                    <InputNumber 
                        style={{ width: '100%' }} 
                        placeholder="Enter number"
                    />
                );
            case 'text':
                return <Input placeholder="Enter text" />;
            case 'select':
                return (
                    <Select 
                        placeholder="Select value" 
                        showSearch
                        allowClear
                        options={selectedAttribute.allowedValues?.map(v => ({ label: v, value: v }))}
                    />
                );
            default:
                return <Input placeholder="Select an attribute first" disabled />;
        }
    };
    
    return (
        <>
            <FloatButton.Group shape="circle" style={{ right: 24 }}>
                <Tooltip title={`Edit ${selectedRowCount} selected items`}>
                    <FloatButton 
                        icon={<EditOutlined />} 
                        badge={{ count: selectedRowCount, color: 'blue' }} 
                        onClick={() => setIsModalVisible(true)} 
                    />
                </Tooltip>
            </FloatButton.Group>

            <Modal
                title={`Bulk Edit ${selectedRowCount} Items`}
                open={isModalVisible}
                onCancel={handleCancel}
                width={600}
                footer={[
                    <Button key="cancel" onClick={handleCancel}>
                        Cancel
                    </Button>,
                    <Button key="apply" type="primary" onClick={handleApply}>
                        Apply to All {selectedRowCount} Items
                    </Button>,
                ]}
            >
                <Form form={form} layout="vertical">
                    <Form.Item 
                        name="attribute" 
                        label="Attribute to Change" 
                        rules={[{ required: true, message: 'Please select an attribute!' }]}
                    >
                        <Select 
                            placeholder="Select attribute to edit"
                            showSearch
                            onChange={handleAttributeSelect}
                            options={schema.map(item => ({ 
                                label: item.label, 
                                value: item.key 
                            }))}
                        />
                    </Form.Item>
                    <Form.Item 
                        name="value" 
                        label="New Value" 
                        rules={[{ required: true, message: 'Please provide a value!' }]}
                    >
                        {renderValueInput()}
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};
