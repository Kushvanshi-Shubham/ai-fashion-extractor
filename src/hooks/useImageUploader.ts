import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ExtractedRow, AttributeData, SchemaItem, AttributeDetail } from '../types';
import { SCHEMA as INITIAL_SCHEMA } from '../schema';
import { notification } from 'antd';
import type { RcFile } from 'antd/es/upload';
import imageCompression from 'browser-image-compression';
import { extractAttributesFromImage } from '../services/openAiService';

const HISTORY_KEY = 'clothingEnrichmentDataHistory';
const SCHEMA_KEY = 'clothingEnrichmentCustomSchema';

export const useImageUploader = () => {
    const [extractedRows, setExtractedRows] = useState<ExtractedRow[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [schema, setSchema] = useState<readonly SchemaItem[]>([...INITIAL_SCHEMA]);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // ADDED: Track blob URLs to prevent premature cleanup
    const blobUrlsRef = useRef<Set<string>>(new Set());

    // Load saved data on mount
    useEffect(() => {
        const savedSchema = localStorage.getItem(SCHEMA_KEY);
        if (savedSchema) { 
            setSchema(JSON.parse(savedSchema)); 
        }
        const savedHistory = localStorage.getItem(HISTORY_KEY);
        if (savedHistory) {
            const loadedRows: Omit<ExtractedRow, 'file'>[] = JSON.parse(savedHistory);
            const rowsWithFiles = loadedRows.map(row => {
                const dummyFile = new File([], row.originalFileName || "") as RcFile;
                dummyFile.uid = row.id;
                
                // FIXED: Preserve image URLs from localStorage, don't create dummy blob URLs
                return { 
                    ...row, 
                    file: dummyFile,
                    // Keep the original imagePreviewUrl from localStorage
                    imagePreviewUrl: row.imagePreviewUrl || '' 
                };
            });
            setExtractedRows(rowsWithFiles);
        }
    }, []);

    // Save data to localStorage - FIXED: Include imagePreviewUrl
    useEffect(() => {
        const historyRows = extractedRows
            .filter(row => row.status === 'Done' || row.status === 'Error')
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .map(({ file: _file, ...rest }) => ({
                ...rest,
                // CRITICAL: Save the imagePreviewUrl to localStorage
                imagePreviewUrl: rest.imagePreviewUrl
            }));
        
        if (historyRows.length > 0) { 
            localStorage.setItem(HISTORY_KEY, JSON.stringify(historyRows)); 
        }
        localStorage.setItem(SCHEMA_KEY, JSON.stringify(schema));
    }, [extractedRows, schema]);

    // MODIFIED: Only cleanup blob URLs on component unmount, not on tab switch
    useEffect(() => {
        return () => {
            // Only cleanup on actual component unmount
            blobUrlsRef.current.forEach(url => {
                if (url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
            blobUrlsRef.current.clear();
        };
    }, []); // Empty dependency array - only on unmount

    // Filter rows based on search term
    const filteredRows = useMemo(() => {
        if (!searchTerm) return extractedRows;
        const lowercasedFilter = searchTerm.toLowerCase();
        return extractedRows.filter(row => {
            if (row.status.toLowerCase().includes(lowercasedFilter)) return true;
            if (row.originalFileName?.toLowerCase().includes(lowercasedFilter)) return true;
            for (const key in row.attributes) {
                const detail = row.attributes[key];
                if (detail) {
                    const schemaValue = detail.schemaValue ? String(detail.schemaValue).toLowerCase() : '';
                    const rawValue = detail.rawValue ? String(detail.rawValue).toLowerCase() : '';
                    if (schemaValue.includes(lowercasedFilter) || rawValue.includes(lowercasedFilter)) return true;
                }
            }
            return false;
        });
    }, [searchTerm, extractedRows]);

    // Handle file upload with compression
    const handleBeforeUpload = useCallback(async (file: RcFile): Promise<boolean> => {
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
        };
        
        try {
            notification.info({
                message: `Compressing ${file.name}...`,
                placement: 'bottomRight',
                duration: 2
            });
            
            const compressedFile = await imageCompression(file, options) as RcFile;
            compressedFile.uid = file.uid;
            
            const imagePreviewUrl = URL.createObjectURL(compressedFile);
            
            // ADDED: Track blob URL
            blobUrlsRef.current.add(imagePreviewUrl);
            
            const newRow: ExtractedRow = {
                id: crypto.randomUUID(),
                file: compressedFile,
                originalFileName: file.name,
                imagePreviewUrl,
                status: 'Pending',
                attributes: schema.reduce((acc, item) => { 
                    acc[item.key] = null; 
                    return acc; 
                }, {} as AttributeData),
            };
            
            setExtractedRows(prev => [...prev, newRow]);
            
            notification.success({
                message: `${file.name} ready for processing`,
                placement: 'bottomRight',
                duration: 2
            });
        } catch (error) {
            notification.error({
                message: 'Image Compression Failed',
                description: error instanceof Error ? error.message : 'Could not process this image.',
                placement: 'bottomRight',
            });
        }
        return false;
    }, [schema]);

    // Delete a row - FIXED: Clean up blob URL properly
    const handleDeleteRow = useCallback((rowId: string) => {
        const rowToDelete = extractedRows.find(row => row.id === rowId);
        if (rowToDelete?.imagePreviewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(rowToDelete.imagePreviewUrl);
            blobUrlsRef.current.delete(rowToDelete.imagePreviewUrl);
        }
        setExtractedRows(prev => prev.filter(row => row.id !== rowId));
        setSelectedRowKeys(prev => prev.filter(key => key !== rowId));
    }, [extractedRows]);

    // Clear all data - FIXED: Clean up all blob URLs
    const handleClearAll = useCallback(() => {
        extractedRows.forEach(row => {
            if (row.imagePreviewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(row.imagePreviewUrl);
                blobUrlsRef.current.delete(row.imagePreviewUrl);
            }
        });
        setExtractedRows([]);
        setSelectedRowKeys([]);
        setSearchTerm('');
        setProgress(0);
        localStorage.removeItem(HISTORY_KEY);
        notification.info({
            message: 'All data cleared.',
            placement: 'bottomRight'
        });
    }, [extractedRows]);

    // ... (rest of the functions remain the same)
    const handleExtractAll = useCallback(async () => {
        const pendingRows = extractedRows.filter(row => row.status === 'Pending' && row.file);
        if (pendingRows.length === 0) {
            notification.info({ 
                message: 'No new images to process.', 
                placement: 'bottomRight' 
            });
            return;
        }
        
        setIsExtracting(true);
        setProgress(0);
        
        const pendingRowIds = new Set(pendingRows.map(r => r.id));
        setExtractedRows(currentRows => currentRows.map(row => 
            pendingRowIds.has(row.id) ? { ...row, status: 'Extracting' as const } : row
        ));
        
        for (let i = 0; i < pendingRows.length; i++) {
            const row = pendingRows[i];
            const startTime = performance.now();
            
            try {
                if (!row.file) throw new Error("File is missing.");
                
                const { attributes, tokensUsed, modelUsed } = await extractAttributesFromImage(row.file, schema);
                const endTime = performance.now();
                const extractionTime = Math.round(endTime - startTime);
                
                setExtractedRows(currentRows => currentRows.map(r => 
                    r.id === row.id ? { 
                        ...r, 
                        status: 'Done' as const, 
                        attributes, 
                        apiTokensUsed: tokensUsed, 
                        modelUsed, 
                        extractionTime 
                    } : r
                ));
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                setExtractedRows(currentRows => currentRows.map(r => 
                    r.id === row.id ? { 
                        ...r, 
                        status: 'Error' as const, 
                        error: errorMessage 
                    } : r 
                ));
            }
            
            setProgress(Math.round(((i + 1) / pendingRows.length) * 100));
        }
        
        setIsExtracting(false);
        setProgress(0);
        notification.success({ 
            message: `Extraction complete! Processed ${pendingRows.length} images.`,
            placement: 'bottomRight'
        });
    }, [extractedRows, schema]);

    const handleAttributeChange = useCallback((rowId: string, key: string, value: string | number | null) => {
        setExtractedRows(prev => prev.map(row => {
            if (row.id === rowId) {
                const detail = row.attributes[key];
                const newDetail: AttributeDetail = (typeof detail === 'object' && detail !== null) ? 
                    { ...detail, schemaValue: value } : 
                    { 
                        schemaValue: value, 
                        rawValue: value === null ? null : String(value), 
                        isNewDiscovery: false, 
                        visualConfidence: 100, 
                        mappingConfidence: 100 
                    };
                return { ...row, attributes: { ...row.attributes, [key]: newDetail } };
            }
            return row;
        }));
    }, []);

    const handleReExtract = useCallback((rowId: string) => {
        setExtractedRows(prev => prev.map(row => 
            row.id === rowId ? { 
                ...row, 
                status: 'Pending' as const, 
                error: undefined,
                attributes: schema.reduce((acc, item) => { 
                    acc[item.key] = null; 
                    return acc; 
                }, {} as AttributeData),
            } : row
        ));
        notification.info({ 
            message: "Row queued for re-extraction.",
            placement: 'bottomRight'
        });
    }, [schema]);

    const handleAddToSchema = useCallback((key: string, value: string) => {
        setSchema(prevSchema => {
            const newSchema = prevSchema.map(item => {
                if (item.key === key && item.allowedValues) {
                    const newAllowedValues = [...item.allowedValues, value];
                    return { ...item, allowedValues: Array.from(new Set(newAllowedValues)) };
                }
                return item;
            });
            return newSchema;
        });
        notification.success({ 
            message: `'${value}' added to schema for '${key}'.`,
            placement: 'bottomRight'
        });
    }, []);

    const handleBulkEdit = useCallback((attributeKey: string, value: string | number | null) => {
        if (selectedRowKeys.length === 0) return;
        
        setExtractedRows(prev => prev.map(row => {
            if (selectedRowKeys.includes(row.id)) {
                const detail = row.attributes[attributeKey];
                const newDetail: AttributeDetail = (typeof detail === 'object' && detail !== null) ? 
                    { ...detail, schemaValue: value } : 
                    { 
                        schemaValue: value, 
                        rawValue: value === null ? null : String(value), 
                        isNewDiscovery: false, 
                        visualConfidence: 100, 
                        mappingConfidence: 100 
                    };
                return { ...row, attributes: { ...row.attributes, [attributeKey]: newDetail } };
            }
            return row;
        }));
        
        notification.success({ 
            message: `${selectedRowKeys.length} rows updated.`,
            placement: 'bottomRight'
        });
        setSelectedRowKeys([]);
    }, [selectedRowKeys]);

    return { 
        extractedRows: filteredRows, 
        schema, 
        isExtracting, 
        progress, 
        selectedRowKeys, 
        setSelectedRowKeys, 
        searchTerm, 
        setSearchTerm, 
        handleBeforeUpload, 
        handleExtractAll, 
        handleAttributeChange, 
        handleDeleteRow, 
        handleReExtract, 
        handleAddToSchema, 
        handleBulkEdit, 
        handleClearAll 
    };
};
