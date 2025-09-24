import { useState, useMemo } from 'react';
import type { CategoryConfig } from '../../types/category/CategoryTypes';
import type { SchemaItem } from '../../types/extraction/ExtractionTypes';
import { PromptService } from '../../services/ai/promptService';
import { useImageExtraction } from './useImageExtraction';
import { message } from 'antd';
import { SchemaGenerator } from '../../utils/category/schemaGenerator';

export const useImageUploader = (selectedCategory: CategoryConfig | null) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const promptService = new PromptService();
  
  const {
    isExtracting,
    extractedRows, 
    progress,
    stats,
    addImages,
    extractSingleImage,
    extractAllPending,
    removeRow,
    clearAll,
    updateRowAttribute
  } = useImageExtraction();

  // Generate dynamic schema based on selected category
  const schema: SchemaItem[] = useMemo(() => {
    if (selectedCategory) {
      const categorySchema = SchemaGenerator.generateSchemaForCategory(selectedCategory);
      console.log(`🎯 Generated ${categorySchema.length} attributes for ${selectedCategory.displayName}`);
      return categorySchema;
    }
    return [];
  }, [selectedCategory]);

  // Handle file upload
  const handleBeforeUpload = async (_file: File, fileList: File[]) => {
    try {
      await addImages(fileList);
      message.success(`Added ${fileList.length} image(s) for processing`);
      return false; // Prevent default upload
    } catch (error) {
      message.error(`Failed to add images: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  // Handle extraction of all pending images
  const handleExtractAll = async () => {
    if (!selectedCategory) {
      message.error('Please select a category first');
      return;
    }

    if (schema.length === 0) {
      message.error('No attributes defined for selected category');
      return;
    }

    try {
      const customPrompt = promptService.generateCategoryPrompt(selectedCategory, schema);
      console.log('🤖 Using category-specific prompt for', selectedCategory.category);
      
      await extractAllPending(schema, customPrompt);
      
      message.success(`Extraction completed for ${selectedCategory.displayName}!`);
    } catch (error) {
      message.error(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle single image re-extraction
  const handleReExtract = async (rowId: string) => {
    if (!selectedCategory) {
      message.error('Please select a category first');
      return;
    }

    const row = extractedRows.find(r => r.id === rowId);
    if (!row) return;

    try {
      const customPrompt = promptService.generateCategoryPrompt(selectedCategory, schema);
      await extractSingleImage(row, schema, customPrompt);
      message.success('Re-extraction completed!');
    } catch (error) {
      message.error(`Re-extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle attribute changes
  const handleAttributeChange = (
    rowId: string,
    attributeKey: string,
    value: string | number | null
  ) => {
    updateRowAttribute(rowId, attributeKey, value);
  };

  // Handle row deletion
  const handleDeleteRow = (rowId: string) => {
    removeRow(rowId);
    setSelectedRowKeys(prev => prev.filter(key => key !== rowId));
  };

  // Handle bulk edits
  const handleBulkEdit = (attributeKey: string, value: string | number | null) => {
    selectedRowKeys.forEach(rowId => {
      updateRowAttribute(String(rowId), attributeKey, value);
    });
    message.success(`Updated ${selectedRowKeys.length} rows`);
  };

  // Handle clear all
  const handleClearAll = async () => {
    clearAll();
    setSelectedRowKeys([]);
    setSearchTerm('');
    message.success('All data cleared');
  };

  // Handle add to schema (placeholder)
  const handleAddToSchema = (attributeKey: string, value: string) => {
    console.log('Add to schema:', attributeKey, value);
    message.info('Add to schema feature will be implemented in advanced version');
  };

  // Filter rows based on search
  const filteredRows = useMemo(() => {
    if (!searchTerm) return extractedRows;
    
    return extractedRows.filter(row =>
      row.originalFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.values(row.attributes).some(attr =>
        attr?.schemaValue?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [extractedRows, searchTerm]);

  return {
    // State
    extractedRows: filteredRows,
    isExtracting,
    progress,
    selectedRowKeys,
    setSelectedRowKeys,
    searchTerm,
    setSearchTerm,
    schema,
    stats,

    // Actions
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
