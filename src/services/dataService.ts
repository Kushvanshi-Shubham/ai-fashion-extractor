import type { ExtractedRow, SchemaItem } from '../types';

// Future-proof interface - works with IndexedDB OR API
export interface DataService {
  // Core CRUD operations
  getAllRows(status?: ExtractedRow['status']): Promise<ExtractedRow[]>;
  getRowById(id: string): Promise<ExtractedRow | null>;
  saveRow(row: ExtractedRow): Promise<void>;
  saveMultipleRows(rows: ExtractedRow[]): Promise<void>;
  deleteRow(id: string): Promise<void>;
  clearAllRows(): Promise<void>;
  
  // Schema management
  getSchema(): Promise<SchemaItem[] | null>;
  saveSchema(schema: readonly SchemaItem[]): Promise<void>;
  
  // Search and filtering
  searchRows(query: string): Promise<ExtractedRow[]>;
  getRowsByDateRange(startDate: Date, endDate: Date): Promise<ExtractedRow[]>;
  
  // Analytics data
  getProcessingStats(): Promise<ProcessingStats>;
  getCostAnalytics(): Promise<CostAnalytics>;
  
  // Maintenance
  cleanup(): Promise<void>;
  exportData(): Promise<ExportData>;
  importData(data: ExportData): Promise<void>;
}

export interface ProcessingStats {
  totalProcessed: number;
  avgProcessingTime: number;
  successRate: number;
  totalTokensUsed: number;
  totalCost: number;
}

export interface CostAnalytics {
  dailyCost: number;
  monthlyCost: number;
  costPerImage: number;
  projectedMonthlyCost: number;
  tokenUsageBreakdown: {
    gpt4o: number;
    gpt4oMini: number;
  };
}

export interface ExportData {
  rows: ExtractedRow[];
  schema: SchemaItem[];
  metadata: {
    exportDate: Date;
    version: string;
    rowCount: number;
  };
}
