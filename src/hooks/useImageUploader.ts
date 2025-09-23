import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ExtractedRow, AttributeData, SchemaItem, AttributeDetail } from '../types';
import { SCHEMA as INITIAL_SCHEMA } from '../schema';
import { extractAttributesFromImage } from "../services/api";
import { notification } from 'antd';
import type { RcFile } from 'antd/es/upload';
import imageCompression from 'browser-image-compression';
import { indexedDBService } from '../services/indexedDBService';
import { migrationService } from '../services/migrationService';
import { performanceMonitor } from '../utils/performance';

export const useImageUploader = () => {
    const [extractedRows, setExtractedRows] = useState<ExtractedRow[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [schema, setSchema] = useState<readonly SchemaItem[]>([...INITIAL_SCHEMA]);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const blobUrlsRef = useRef<Set<string>>(new Set());
    const isInitializedRef = useRef(false);

    // Initialize and load data
    useEffect(() => {
        const initializeData = async () => {
            if (isInitializedRef.current) return;
            isInitializedRef.current = true;

            const endTimer = performanceMonitor.startTimer('data_initialization');
            setIsLoading(true);
            
            try {
                await indexedDBService.init();
                
                const needsMigration = await migrationService.checkMigrationNeeded();
                
                if (needsMigration) {
                    console.log('%c[App] Migration needed - starting automatic migration', 'color: #faad14;');
                    const migrationResult = await migrationService.migrateFromLocalStorage();
                    
                    if (!migrationResult.success) {
                        console.error('Migration failed:', migrationResult.error);
                    }
                }
                
                const [rows, savedSchema] = await Promise.all([
                    indexedDBService.getAllRows(),
                    indexedDBService.getSchema()
                ]);
                
                if (savedSchema && savedSchema.length > 0) {
                    setSchema(savedSchema);
                } else {
                    await indexedDBService.saveSchema(INITIAL_SCHEMA);
                }
                
                const rowsWithFiles = rows.map(row => {
                    const dummyFile = new File([], row.originalFileName || "") as RcFile;
                    dummyFile.uid = row.id;
                    return { ...row, file: dummyFile };
                });
                
                setExtractedRows(rowsWithFiles);
                
                indexedDBService.cleanup().catch(console.error);
                
                const loadTime = endTimer();
                console.log(`%c[App] Data loaded in ${loadTime.toFixed(2)}ms`, 'color: #52c41a;');
                
                if (rows.length > 0) {
                    notification.success({
                        message: `Welcome back! 👋`,
                        description: `Loaded ${rows.length} images from your previous session.`,
                        placement: 'bottomRight',
                        duration: 3
                    });
                }
                
            } catch (error) {
                console.error('Failed to initialize data:', error);
                notification.error({
                    message: 'Initialization Failed',
                    description: 'Starting with fresh data. Previous work may be recovered.',
                    placement: 'bottomRight',
                    duration: 5
                });
            } finally {
                setIsLoading(false);
            }
        };
        
        initializeData();
    }, []);

    // Auto-save to IndexedDB (debounced)
    const debouncedSave = useMemo(() => {
        let timeoutId: NodeJS.Timeout;
        return (rows: ExtractedRow[], currentSchema: readonly SchemaItem[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                const endTimer = performanceMonitor.startTimer('auto_save');
                
                try {
                    const completedRows = rows.filter(row => 
                        row.status === 'Done' || row.status === 'Error'
                    );
                    
                    await Promise.all([
                        indexedDBService.saveMultipleRows(completedRows),
                        indexedDBService.saveSchema(currentSchema)
                    ]);
                    
                    const saveTime = endTimer();
                    console.log(`%c[Auto-save] Saved ${completedRows.length} rows in ${saveTime.toFixed(2)}ms`, 'color: #52c41a;');
                } catch (error) {
                    endTimer();
                    console.error('Auto-save failed:', error);
                }
            }, 2000);
        };
    }, []);

    // Auto-save effect
    useEffect(() => {
        if (!isLoading && extractedRows.length > 0) {
            debouncedSave(extractedRows, schema);
        }
    }, [extractedRows, schema, isLoading, debouncedSave]);

    // FIXED: Cleanup blob URLs with proper ref handling
    useEffect(() => {
        const currentBlobUrls = blobUrlsRef.current;
        return () => {
            currentBlobUrls.forEach(url => {
                if (url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
            currentBlobUrls.clear();
        };
    }, []);

    // Filter rows with performance optimization
    const filteredRows = useMemo(() => {
        const endTimer = performanceMonitor.startTimer('search_filter');
        
        if (!searchTerm) {
            endTimer();
            return extractedRows;
        }
        
        // FIXED: Remove unused result variable by directly using the function call
        indexedDBService.searchRows(searchTerm);
        
        const localFiltered = extractedRows.filter(row => {
            const lowercasedFilter = searchTerm.toLowerCase();
            
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
        
        endTimer();
        return localFiltered;
    }, [searchTerm, extractedRows]);

    // Enhanced file upload with better error handling
    const handleBeforeUpload = useCallback(async (file: RcFile): Promise<boolean> => {
        const endTimer = performanceMonitor.startTimer('image_compression');
        
        const options = {
            maxSizeMB: 2,
            maxWidthOrHeight: 1536,
            useWebWorker: true,
            fileType: 'image/jpeg',
            quality: 0.8,
            initialQuality: 0.8
        };
        
        try {
            if (file.size > 20 * 1024 * 1024) {
                throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size: 20MB.`);
            }

            if (!file.type.startsWith('image/')) {
                throw new Error('Please upload a valid image file.');
            }

            notification.info({
                message: `📸 Processing ${file.name}`,
                description: `Compressing ${(file.size / 1024).toFixed(0)}KB image...`,
                placement: 'bottomRight',
                duration: 2
            });
            
            const compressedFile = await imageCompression(file, options) as RcFile;
            compressedFile.uid = file.uid;
            
            if (compressedFile.size < 10000) {
                throw new Error('Image too small after compression. Use a higher quality image.');
            }
            
            const compressionTime = endTimer();
            const imagePreviewUrl = URL.createObjectURL(compressedFile);
            blobUrlsRef.current.add(imagePreviewUrl);
            
            const newRow: ExtractedRow = {
                id: crypto.randomUUID(),
                file: compressedFile,
                originalFileName: file.name,
                imagePreviewUrl,
                status: 'Pending',
                createdAt: new Date(),
                attributes: schema.reduce((acc, item) => { 
                    acc[item.key] = null; 
                    return acc; 
                }, {} as AttributeData),
            };
            
            setExtractedRows(prev => [newRow, ...prev]);
            
            notification.success({
                message: `✅ ${file.name} ready!`,
                description: `Compressed to ${(compressedFile.size / 1024).toFixed(0)}KB in ${compressionTime.toFixed(0)}ms`,
                placement: 'bottomRight',
                duration: 2
            });
            
        } catch (error) {
            endTimer();
            console.error('Image processing error:', error);
            notification.error({
                message: '❌ Image Processing Failed',
                description: error instanceof Error ? error.message : 'Could not process this image.',
                placement: 'bottomRight',
                duration: 6
            });
        }
        return false;
    }, [schema]);
    
    // Enhanced extraction with better progress tracking
    const handleExtractAll = useCallback(async () => {
        const pendingRows = extractedRows.filter(row => row.status === 'Pending' && row.file);
        if (pendingRows.length === 0) {
            notification.info({ 
                message: '🔍 No images to process',
                description: 'Upload some images first, then click Extract All.',
                placement: 'bottomRight' 
            });
            return;
        }
        
        const extractionStartTime = performance.now();
        setIsExtracting(true);
        setProgress(0);
        
        const pendingRowIds = new Set(pendingRows.map(r => r.id));
        setExtractedRows(currentRows => currentRows.map(row => 
            pendingRowIds.has(row.id) ? { ...row, status: 'Extracting' as const } : row
        ));
        
        let successCount = 0;
        let errorCount = 0;
        let totalTokensUsed = 0;
        let totalCost = 0;
        
        notification.info({
            key: 'extraction-progress',
            message: `🚀 Starting extraction...`,
            description: `Processing ${pendingRows.length} images with AI`,
            placement: 'bottomRight',
            duration: 0
        });
        
        for (let i = 0; i < pendingRows.length; i++) {
            const row = pendingRows[i];
            const startTime = performance.now();
            
            notification.info({
                key: 'extraction-progress',
                message: `🔍 Processing image ${i + 1}/${pendingRows.length}`,
                description: `Working on: ${row.originalFileName}`,
                placement: 'bottomRight',
                duration: 0
            });
            
            try {
                if (!row.file) throw new Error("File is missing.");
                
                if (i === 0) {
                    console.log(`%c[First Image] ${row.originalFileName} (${row.file.size} bytes)`, 'color: #52c41a;');
                    
                    if (row.file.size < 10000) {
                        throw new Error("Image too small for analysis. Try a higher quality image.");
                    }
                }
                
                const { attributes, tokensUsed, modelUsed } = await extractAttributesFromImage(row.file, schema);
                const endTime = performance.now();
                const extractionTime = Math.round(endTime - startTime);
                
                const costPerMillion = modelUsed === 'gpt-4o' ? 5 : 0.15;
                const imageCost = (tokensUsed / 1000000) * costPerMillion;
                
                totalTokensUsed += tokensUsed;
                totalCost += imageCost;
                
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
                
                successCount++;
                performanceMonitor.recordMetric('ai_extraction', extractionTime);
                
                console.log(`%c[✓] ${row.originalFileName}: ${extractionTime}ms, $${imageCost.toFixed(4)}`, 'color: #52c41a;');
                
            } catch (error) {
                console.error(`%c[✗] ${row.originalFileName}:`, 'color: #ff4d4f;', error);
                
                let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred.';
                
                if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
                    errorMessage = '⏱️ Rate limit hit. Try again in a few minutes.';
                } else if (errorMessage.includes('Invalid response') || errorMessage.includes('JSON')) {
                    errorMessage = '🖼️ Image unclear. Try a higher quality photo.';
                } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
                    errorMessage = '🌐 Network issue. Check connection and retry.';
                } else if (errorMessage.includes('API key')) {
                    errorMessage = '🔑 API configuration issue. Check settings.';
                }
                
                setExtractedRows(currentRows => currentRows.map(r => 
                    r.id === row.id ? { 
                        ...r, 
                        status: 'Error' as const, 
                        error: errorMessage 
                    } : r 
                ));
                
                errorCount++;
            }
            
            setProgress(Math.round(((i + 1) / pendingRows.length) * 100));
        }
        
        const totalExtractionTime = performance.now() - extractionStartTime;
        
        setIsExtracting(false);
        setProgress(0);
        
        notification.destroy('extraction-progress');
        
        if (successCount > 0 && errorCount === 0) {
            notification.success({
                key: 'extraction-complete',
                message: `🎉 Extraction Complete!`,
                description: `✅ ${successCount} images processed successfully\n💰 Cost: $${totalCost.toFixed(4)} | ⚡ ${(totalExtractionTime/1000).toFixed(1)}s`,
                placement: 'bottomRight',
                duration: 8
            });
        } else if (successCount > 0 && errorCount > 0) {
            notification.warning({
                key: 'extraction-complete',
                message: `⚠️ Partial Success`,
                description: `✅ ${successCount} succeeded, ❌ ${errorCount} failed\n💰 Cost: $${totalCost.toFixed(4)} | Check errors and retry failed items.`,
                placement: 'bottomRight',
                duration: 10
            });
        } else {
            notification.error({
                key: 'extraction-complete',
                message: `❌ Extraction Failed`,
                description: `All ${errorCount} images failed. Check image quality and API connection.`,
                placement: 'bottomRight',
                duration: 12
            });
        }
        
        console.log(`%c[Extraction Summary]`, 'color: #1890ff; font-weight: bold;');
        console.log(`Total time: ${(totalExtractionTime/1000).toFixed(1)}s`);
        console.log(`Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
        console.log(`Total tokens: ${totalTokensUsed.toLocaleString()}`);
        console.log(`Total cost: $${totalCost.toFixed(4)}`);
        
    }, [extractedRows, schema]);

    // Enhanced attribute change with tracking
    const handleAttributeChange = useCallback((rowId: string, key: string, value: string | number | null) => {
        setExtractedRows(prev => prev.map(row => {
            if (row.id === rowId) {
                const detail = row.attributes[key];
                const oldValue = detail?.schemaValue;
                
                if (oldValue && oldValue !== value) {
                    indexedDBService.trackCorrection({
                        rowId,
                        attributeKey: key,
                        originalValue: String(oldValue),
                        correctedValue: String(value || ''),
                        reason: 'manual_correction'
                    }).catch(console.error);
                }
                
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

    // Enhanced delete with cleanup
    const handleDeleteRow = useCallback(async (rowId: string) => {
        const rowToDelete = extractedRows.find(row => row.id === rowId);
        
        if (rowToDelete?.imagePreviewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(rowToDelete.imagePreviewUrl);
            blobUrlsRef.current.delete(rowToDelete.imagePreviewUrl);
        }
        
        setExtractedRows(prev => prev.filter(row => row.id !== rowId));
        setSelectedRowKeys(prev => prev.filter(key => key !== rowId));
        
        await indexedDBService.deleteRow(rowId);
        
        notification.info({
            message: 'Image deleted',
            description: `${rowToDelete?.originalFileName || 'Image'} removed from your collection.`,
            placement: 'bottomRight',
            duration: 3
        });
    }, [extractedRows]);

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
            message: "🔄 Queued for re-extraction",
            description: "This image will be processed again with the current AI model.",
            placement: 'bottomRight'
        });
    }, [schema]);

    const handleAddToSchema = useCallback(async (key: string, value: string) => {
        const newSchema = schema.map(item => {
            if (item.key === key && item.allowedValues) {
                const newAllowedValues = [...item.allowedValues, value];
                return { ...item, allowedValues: Array.from(new Set(newAllowedValues)) };
            }
            return item;
        });
        
        setSchema(newSchema);
        await indexedDBService.saveSchema(newSchema);
        
        notification.success({ 
            message: `📝 Schema updated`,
            description: `Added '${value}' to ${key.replace('_', ' ')} options.`,
            placement: 'bottomRight'
        });
    }, [schema]);

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
            message: `✨ Bulk update complete`,
            description: `Updated ${selectedRowKeys.length} images.`,
            placement: 'bottomRight'
        });
        setSelectedRowKeys([]);
    }, [selectedRowKeys]);
    
    const handleClearAll = useCallback(async () => {
        blobUrlsRef.current.forEach(url => {
            if (url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
        blobUrlsRef.current.clear();
        
        setExtractedRows([]);
        setSelectedRowKeys([]);
        setSearchTerm('');
        setProgress(0);
        
        await indexedDBService.clearAllRows();
        
        notification.info({
            message: '🗑️ All data cleared',
            description: 'Your workspace is now empty and ready for new images.',
            placement: 'bottomRight'
        });
    }, []);

    return { 
        extractedRows: filteredRows, 
        schema, 
        isExtracting, 
        isLoading, 
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
