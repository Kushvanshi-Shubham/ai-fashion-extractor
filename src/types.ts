import type { RcFile } from "antd/es/upload";

export interface SchemaItem {
    key: string;
    label: string;
    type: 'select' | 'text' | 'number';
    allowedValues?: string[];
}

export interface AttributeDetail {
    schemaValue: string | number | null;
    rawValue: string | null;
    isNewDiscovery: boolean;
    visualConfidence: number;
    mappingConfidence: number;
}

export type AttributeData = {
    [key: string]: AttributeDetail | null;
};

export interface ExtractedRow {
    id: string;
    file: RcFile;
    originalFileName: string; // NEW: To preserve the original name after compression
    imagePreviewUrl: string;
    status: 'Pending' | 'Extracting' | 'Done' | 'Error';
    attributes: AttributeData;
    error?: string;
    apiTokensUsed?: number;
    modelUsed?: 'gpt-4o' | 'gpt-4o-mini';
    extractionTime?: number;
}

