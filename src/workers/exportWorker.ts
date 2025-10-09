// Web Worker for XLSX export - eliminates UI blocking
import * as XLSX from 'xlsx';

interface ExtractedRow {
  status: string;
  attributes: Record<string, { value: string; confidence: number; schemaValue?: unknown }>;
  imageName: string;
  originalFileName: string;
  processingTime: number;
  extractionTime: number;
  extractionDate: string;
  updatedAt?: { toISOString?: () => string };
  aiModel: string;
  modelUsed: string;
  tokensUsed: number;
  apiTokensUsed: number;
  confidence: number;
}

interface ExportMessage {
  id: string;
  type: 'EXPORT_XLSX';
  payload: {
    extractedRows: ExtractedRow[];
    filename: string;
    schema: Record<string, unknown>[];
  };
}

interface ExportResponse {
  id: string;
  type: 'EXPORT_COMPLETE' | 'EXPORT_ERROR' | 'EXPORT_PROGRESS';
  payload: {
    success?: boolean;
    progress?: number;
    downloadUrl?: string;
    error?: string;
  };
}

self.onmessage = async (event: MessageEvent<ExportMessage>) => {
  const { id, type, payload } = event.data;
  
  if (type !== 'EXPORT_XLSX') return;
  
  try {
    const { extractedRows, schema } = payload;
    
    // Progress reporting
    self.postMessage({
      id,
      type: 'EXPORT_PROGRESS',
      payload: { progress: 10 }
    } as ExportResponse);
    
    // Filter completed rows
    const doneRows = extractedRows.filter((r: ExtractedRow) => r.status === 'Done');
    
    self.postMessage({
      id,
      type: 'EXPORT_PROGRESS', 
      payload: { progress: 20 }
    } as ExportResponse);
    
    // Transform data efficiently (batched processing)
    const batchSize = 100;
    const exportData: Record<string, unknown>[] = [];
    
    for (let i = 0; i < doneRows.length; i += batchSize) {
      const batch = doneRows.slice(i, i + batchSize);
      
      const batchData = batch.map((row: ExtractedRow, index: number) => {
        const exportRow: Record<string, unknown> = {
          'Row': i + index + 1,
          'Image Name': row.originalFileName,
          'Status': row.status,
          'Extraction Date': row.updatedAt?.toISOString?.() || new Date().toISOString(),
          'Processing Time (ms)': row.extractionTime || 0,
          'AI Model': row.modelUsed || 'gpt-4o',
          'Tokens Used': row.apiTokensUsed || 0,
          'Confidence': row.confidence || 0,
        };

        // Add schema attributes
        if (row.attributes) {
          Object.entries(row.attributes).forEach(([key, attribute]: [string, { value: string; confidence: number; schemaValue?: unknown }]) => {
            if (attribute && attribute.schemaValue !== null && attribute.schemaValue !== undefined) {
              const value = attribute.schemaValue;
              exportRow[key] = typeof value === 'string' || typeof value === 'number' ? value : String(value);
            }
          });
        }

        return exportRow;
      });
      
      exportData.push(...batchData);
      
      // Report progress
      const progress = 20 + (i / doneRows.length) * 60;
      self.postMessage({
        id,
        type: 'EXPORT_PROGRESS',
        payload: { progress: Math.round(progress) }
      } as ExportResponse);
    }
    
    self.postMessage({
      id,
      type: 'EXPORT_PROGRESS',
      payload: { progress: 85 }
    } as ExportResponse);
    
    // Create XLSX file
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fashion Extraction Data');
    
    // Add metadata sheet
    const metadataSheet = XLSX.utils.json_to_sheet([{
      'Export Date': new Date().toISOString(),
      'Total Rows': exportData.length,
      'Schema Attributes': schema.length,
      'App Version': '2.0.0'
    }]);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
    
    self.postMessage({
      id,
      type: 'EXPORT_PROGRESS',
      payload: { progress: 95 }
    } as ExportResponse);
    
    // Generate file
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const downloadUrl = URL.createObjectURL(blob);
    
    self.postMessage({
      id,
      type: 'EXPORT_COMPLETE',
      payload: { 
        success: true, 
        downloadUrl,
        progress: 100 
      }
    } as ExportResponse);
    
  } catch (error) {
    self.postMessage({
      id,
      type: 'EXPORT_ERROR',
      payload: { 
        error: error instanceof Error ? error.message : 'Export failed' 
      }
    } as ExportResponse);
  }
};
