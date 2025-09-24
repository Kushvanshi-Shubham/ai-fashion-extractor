import { useState, useCallback, useMemo } from 'react';
import type { ExtractedRow, ExtractionResult, SchemaItem } from '../../types/extraction/ExtractionTypes';
import { ExtractionService } from '../../services/ai/extractionService';
import { ImageProcessor } from '../../utils/extraction/imageProcessing';
import { generateId } from '../../utils/common/helpers';

export const useImageExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedRows, setExtractedRows] = useState<ExtractedRow[]>([]);
  const [progress, setProgress] = useState(0);

  // ✅ FIX: Memoize services to prevent recreation on every render
  const extractionService = useMemo(() => new ExtractionService(), []);
  const imageProcessor = useMemo(() => new ImageProcessor(), []);
 
  const createExtractedRow = useCallback(async (file: File): Promise<ExtractedRow> => {
    const imagePreviewUrl = await imageProcessor.createPreviewUrl(file);
    
    return {
      id: generateId(),
      file,
      originalFileName: file.name,
      imagePreviewUrl,
      status: 'Pending',
      attributes: {},
      createdAt: new Date()
    };
  }, [imageProcessor]);

  const extractSingleImage = useCallback(async (
    row: ExtractedRow,
    schema: SchemaItem[],
    customPrompt?: string
  ): Promise<ExtractedRow> => {
    try {
      // Update status to extracting
      const updatingRow = { ...row, status: 'Extracting' as const };
      setExtractedRows(prev => prev.map(r => r.id === row.id ? updatingRow : r));

      // Perform extraction
      const result: ExtractionResult = await extractionService.extractAttributes(
        row.file,
        schema,
        customPrompt
      );

      // Create successful result
      const successRow: ExtractedRow = {
        ...row,
        status: 'Done',
        attributes: result.attributes,
        apiTokensUsed: result.tokensUsed,
        modelUsed: result.modelUsed,
        extractionTime: result.processingTime,
        updatedAt: new Date()
      };

      setExtractedRows(prev => prev.map(r => r.id === row.id ? successRow : r));
      return successRow;

    } catch (error) {
      // Create error result
      const errorRow: ExtractedRow = {
        ...row,
        status: 'Error',
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date()
      };

      setExtractedRows(prev => prev.map(r => r.id === row.id ? errorRow : r));
      return errorRow;
    }
  }, [extractionService]);

  const extractAllPending = useCallback(async (
    schema: SchemaItem[],
    customPrompt?: string
  ) => {
    const pendingRows = extractedRows.filter(row => row.status === 'Pending');
    if (pendingRows.length === 0) return;

    setIsExtracting(true);
    setProgress(0);

    try {
      for (let i = 0; i < pendingRows.length; i++) {
        await extractSingleImage(pendingRows[i], schema, customPrompt);
        setProgress((i + 1) / pendingRows.length * 100);
      }
    } finally {
      setIsExtracting(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 2000); // Reset progress after success
    }
  }, [extractedRows, extractSingleImage]);

  const addImages = useCallback(async (files: File[]) => {
    const newRows = await Promise.all(
      files.map(file => createExtractedRow(file))
    );
    
    setExtractedRows(prev => [...prev, ...newRows]);
    return newRows;
  }, [createExtractedRow]);

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
      if (row.id === rowId && row.attributes[attributeKey]) {
        return {
          ...row,
          attributes: {
            ...row.attributes,
            [attributeKey]: {
              ...row.attributes[attributeKey]!,
              schemaValue: value,
              rawValue: value ? String(value) : null
            }
          },
          updatedAt: new Date()
        };
      }
      return row;
    }));
  }, []);

  // ✅ OPTIMIZED: Memoize statistics to prevent unnecessary recalculations
  const stats = useMemo(() => ({
    total: extractedRows.length,
    pending: extractedRows.filter(row => row.status === 'Pending').length,
    extracting: extractedRows.filter(row => row.status === 'Extracting').length,
    done: extractedRows.filter(row => row.status === 'Done').length,
    error: extractedRows.filter(row => row.status === 'Error').length,
    successRate: extractedRows.length > 0 
      ? (extractedRows.filter(row => row.status === 'Done').length / extractedRows.length) * 100 
      : 0
  }), [extractedRows]);

  return {
    // State
    isExtracting,
    extractedRows,
    progress,
    stats,
    
    // Actions
    addImages,
    extractSingleImage,
    extractAllPending,
    removeRow,
    clearAll,
    updateRowAttribute
  };
};
