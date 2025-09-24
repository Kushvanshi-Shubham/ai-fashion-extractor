import { useState, useCallback, useMemo } from 'react';
import type { ExtractedRow, ExtractionResult, SchemaItem, AttributeDetail } from '../../types/extraction/ExtractionTypes';
import { ExtractionService } from '../../services/ai/extractionService';
import { message } from 'antd';
import { generateId } from '../../utils/common/helpers';
import { logger } from '../../utils/common/logger';

export const useImageExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedRows, setExtractedRows] = useState<ExtractedRow[]>([]);
  const [progress, setProgress] = useState(0);

  // ✅ Simple compression function (no Web Worker)
  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        // Calculate dimensions maintaining aspect ratio
        const maxSize = 800;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        const width = Math.round(img.width * ratio);
        const height = Math.round(img.height * ratio);
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedDataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Initialize ExtractionService with compressImage function
  const extractionService = useMemo(() => new ExtractionService(compressImage), [compressImage]);

  const createExtractedRow = useCallback(async (file: File): Promise<ExtractedRow> => {
    let base64Preview = '';
    try {
      base64Preview = await compressImage(file);
    } catch (err) {
      logger.error('Compression failed, using original file',  err as Error);
      // Fallback: create a simple preview
      base64Preview = URL.createObjectURL(file);
    }

    return {
      id: generateId(),
      file,
      originalFileName: file.name,
      imagePreviewUrl: base64Preview,
      status: 'Pending',
      attributes: {},
      createdAt: new Date(),
    };
  }, [compressImage]);

  const addImages = useCallback(async (files: File[]) => {
    const newRows = await Promise.all(files.map(createExtractedRow));

    setExtractedRows(prev => {
      const existingFileNames = new Set(prev.map(row => row.originalFileName));
      const filteredNewRows = newRows.filter(row => !existingFileNames.has(row.originalFileName));
      return [...prev, ...filteredNewRows];
    });

    return newRows;
  }, [createExtractedRow]);

  const extractSingleImage = useCallback(async (
    row: ExtractedRow,
    schema: SchemaItem[],
    customPrompt?: string
  ): Promise<ExtractedRow> => {
    try {
      const updatingRow = { ...row, status: 'Extracting' as const };
      setExtractedRows(prev => prev.map(r => r.id === row.id ? updatingRow : r));

      const result: ExtractionResult = await extractionService.extractAttributes(
        row.file, 
        schema, 
        customPrompt
      );

      const successRow: ExtractedRow = {
        ...row,
        status: 'Done',
        attributes: result.attributes,
        apiTokensUsed: result.tokensUsed,
        modelUsed: result.modelUsed,
        extractionTime: result.processingTime,
        updatedAt: new Date(),
        error: undefined,
      };

      setExtractedRows(prev => prev.map(r => r.id === row.id ? successRow : r));
      return successRow;
    } catch (error) {
      const loggableError = error instanceof Error ? error : new Error(String(error));
      const errorRow = { 
        ...row, 
        status: 'Error' as const, 
        error: loggableError.message, 
        updatedAt: new Date() 
      };
      
      setExtractedRows(prev => prev.map(r => r.id === row.id ? errorRow : r));
      message.error(`Extraction failed: ${loggableError.message}`);
      logger.error('Extraction failed', loggableError);
      return errorRow;
    }
  }, [extractionService]);

  const extractAllPending = useCallback(async (
    schema: SchemaItem[],
    customPrompt?: string
  ) => {
    const pendingRows = extractedRows.filter(row => row.status === 'Pending');
    if (!pendingRows.length) return;

    setIsExtracting(true);
    setProgress(0);

    const concurrency = 3;
    const pool: Promise<void>[] = [];
    let completed = 0;

    const handleProgress = () => {
      completed++;
      setProgress((completed / pendingRows.length) * 100);
    };

    const enqueue = async (p: Promise<void>) => {
      pool.push(p);
      try {
        await p;
      } finally {
        const index = pool.indexOf(p);
        if (index > -1) {
          pool.splice(index, 1);
        }
      }
    };

    for (const row of pendingRows) {
      const p = extractSingleImage(row, schema, customPrompt)
        .then(() => handleProgress())
        .catch(() => handleProgress());
      
      if (pool.length >= concurrency) {
        await Promise.race(pool);
      }

      await enqueue(p);
    }

    await Promise.all(pool);

    setIsExtracting(false);
    setProgress(100);
    setTimeout(() => setProgress(0), 3000);
  }, [extractedRows, extractSingleImage]);

  const removeRow = useCallback((rowId: string) => {
    setExtractedRows(prev => prev.filter(row => row.id !== rowId));
  }, []);

  const clearAll = useCallback(() => {
    setExtractedRows([]);
    setProgress(0);
  }, []);

  const updateRowAttribute = useCallback((
    rowId: string,
    attributeKey: string,
    value: string | number | null
  ) => {
    setExtractedRows(prev => prev.map(row => {
      if (row.id === rowId) {
        const existingAttribute = row.attributes[attributeKey];
        
        const updatedAttribute: AttributeDetail = {
          rawValue: value ? String(value) : null,
          schemaValue: value,
          visualConfidence: existingAttribute?.visualConfidence ?? 0,
          mappingConfidence: existingAttribute?.mappingConfidence ?? 100,
          isNewDiscovery: existingAttribute?.isNewDiscovery ?? false,
          reasoning: existingAttribute?.reasoning
        };

        return {
          ...row,
          attributes: {
            ...row.attributes,
            [attributeKey]: updatedAttribute
          },
          updatedAt: new Date(),
        } as ExtractedRow;
      }
      return row;
    }));
  }, []);

  const stats = useMemo(() => ({
    total: extractedRows.length,
    pending: extractedRows.filter(row => row.status === 'Pending').length,
    extracting: extractedRows.filter(row => row.status === 'Extracting').length,
    done: extractedRows.filter(row => row.status === 'Done').length,
    error: extractedRows.filter(row => row.status === 'Error').length,
    successRate: extractedRows.length > 0
      ? (extractedRows.filter(row => row.status === 'Done').length / extractedRows.length) * 100
      : 0,
  }), [extractedRows]);

  return {
    isExtracting,
    extractedRows,
    progress,
    stats,
    addImages,
    extractSingleImage,
    extractAllPending,
    removeRow,
    clearAll,
    updateRowAttribute,
    compressImage,
  };
};
