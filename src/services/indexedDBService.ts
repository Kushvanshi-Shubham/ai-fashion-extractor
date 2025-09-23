import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DataService, ProcessingStats, CostAnalytics, ExportData } from './dataService';
import type { ExtractedRow, SchemaItem } from '../types';

// Define database schema
interface ClothingDB extends DBSchema {
  rows: {
    key: string;
    value: ExtractedRow & { 
      createdAt: Date; 
      updatedAt: Date; 
    };
    indexes: { 
      'by-status': string; 
      'by-date': Date;
      'by-filename': string;
    };
  };
  schema: {
    key: string;
    value: {
      data: SchemaItem[];
      updatedAt: Date;
    };
  };
  settings: {
    key: string;
    value: Record<string, unknown>;
  };
  corrections: {
    key: string;
    value: {
      id: string;
      rowId: string;
      attributeKey: string;
      originalValue: string;
      correctedValue: string;
      timestamp: Date;
      reason?: string;
    };
    indexes: {
      'by-row': string;
      'by-attribute': string;
    };
  };
}

class IndexedDBService implements DataService {
  private db: IDBPDatabase<ClothingDB> | null = null;
  private readonly DB_NAME = 'clothing-analyzer';
  private readonly DB_VERSION = 2;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<ClothingDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`%c[IndexedDB] Upgrading from v${oldVersion} to v${newVersion}`, 'color: #1890ff;');
        
        // Create rows store
        if (!db.objectStoreNames.contains('rows')) {
          const rowsStore = db.createObjectStore('rows', { keyPath: 'id' });
          rowsStore.createIndex('by-status', 'status');
          rowsStore.createIndex('by-date', 'createdAt');
          rowsStore.createIndex('by-filename', 'originalFileName');
        }
        
        // Create schema store
        if (!db.objectStoreNames.contains('schema')) {
          db.createObjectStore('schema');
        }
        
        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }

        // Create corrections store (for analytics)
        if (!db.objectStoreNames.contains('corrections')) {
          const correctionsStore = db.createObjectStore('corrections', { keyPath: 'id' });
          correctionsStore.createIndex('by-row', 'rowId');
          correctionsStore.createIndex('by-attribute', 'attributeKey');
        }
      },
      blocked() {
        console.warn('[IndexedDB] Database upgrade blocked. Please close other tabs.');
      },
      blocking() {
        console.warn('[IndexedDB] Database blocking other connections.');
      }
    });

    console.log('%c[IndexedDB] Database initialized successfully', 'color: #52c41a;');
  }

  // Core CRUD Operations
  async getAllRows(status?: ExtractedRow['status']): Promise<ExtractedRow[]> {
    await this.init();
    
    if (status) {
      return await this.db!.getAllFromIndex('rows', 'by-status', status);
    }
    
    const rows = await this.db!.getAll('rows');
    return rows.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getRowById(id: string): Promise<ExtractedRow | null> {
    await this.init();
    const row = await this.db!.get('rows', id);
    return row || null;
  }

  async saveRow(row: ExtractedRow): Promise<void> {
    await this.init();
    const now = new Date();
    const rowWithTimestamps = {
      ...row,
      createdAt: row.createdAt || now,
      updatedAt: now
    };
    await this.db!.put('rows', rowWithTimestamps);
  }

  async saveMultipleRows(rows: ExtractedRow[]): Promise<void> {
    await this.init();
    const tx = this.db!.transaction('rows', 'readwrite');
    const now = new Date();
    
    await Promise.all([
      ...rows.map(row => tx.store.put({
        ...row,
        createdAt: row.createdAt || now,
        updatedAt: now
      })),
      tx.done
    ]);
  }

  async deleteRow(id: string): Promise<void> {
    await this.init();
    await this.db!.delete('rows', id);
  }

  async clearAllRows(): Promise<void> {
    await this.init();
    await this.db!.clear('rows');
  }

  // Schema Management
  async getSchema(): Promise<SchemaItem[] | null> {
    await this.init();
    const schemaData = await this.db!.get('schema', 'current');
    return schemaData?.data || null;
  }

  async saveSchema(schema: readonly SchemaItem[]): Promise<void> {
    await this.init();
    // FIXED: Correct parameter order for put method - value first, then key
    await this.db!.put('schema', {
      data: [...schema],
      updatedAt: new Date()
    }, 'current');
  }

  // Search and Filtering
  async searchRows(query: string): Promise<ExtractedRow[]> {
    await this.init();
    const allRows = await this.getAllRows();
    const lowercaseQuery = query.toLowerCase();
    
    return allRows.filter(row => {
      // Search in filename
      if (row.originalFileName?.toLowerCase().includes(lowercaseQuery)) return true;
      
      // Search in status
      if (row.status.toLowerCase().includes(lowercaseQuery)) return true;
      
      // Search in attributes
      for (const detail of Object.values(row.attributes)) {
        if (detail) {
          const schemaValue = detail.schemaValue ? String(detail.schemaValue).toLowerCase() : '';
          const rawValue = detail.rawValue ? String(detail.rawValue).toLowerCase() : '';
          if (schemaValue.includes(lowercaseQuery) || rawValue.includes(lowercaseQuery)) {
            return true;
          }
        }
      }
      
      return false;
    });
  }

  async getRowsByDateRange(startDate: Date, endDate: Date): Promise<ExtractedRow[]> {
    await this.init();
    const tx = this.db!.transaction('rows', 'readonly');
    const index = tx.store.index('by-date');
    const range = IDBKeyRange.bound(startDate, endDate);
    return await index.getAll(range);
  }

  // Analytics
  async getProcessingStats(): Promise<ProcessingStats> {
    await this.init();
    const doneRows = await this.getAllRows('Done');
    
    const processingTimes = doneRows
      .filter(row => row.extractionTime)
      .map(row => row.extractionTime!);
    
    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0;
    
    const totalTokensUsed = doneRows
      .filter(row => row.apiTokensUsed)
      .reduce((total, row) => total + (row.apiTokensUsed || 0), 0);
    
    const errorRows = await this.getAllRows('Error');
    const totalProcessed = doneRows.length + errorRows.length;
    const successRate = totalProcessed > 0 ? (doneRows.length / totalProcessed) * 100 : 0;
    
    // Calculate cost based on token usage and model
    const totalCost = doneRows.reduce((cost, row) => {
      const tokens = row.apiTokensUsed || 0;
      const costPerMillion = row.modelUsed === 'gpt-4o' ? 5 : 0.15;
      return cost + (tokens / 1000000) * costPerMillion;
    }, 0);

    return {
      totalProcessed: doneRows.length,
      avgProcessingTime,
      successRate,
      totalTokensUsed,
      totalCost
    };
  }

  async getCostAnalytics(): Promise<CostAnalytics> {
    await this.init();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const monthlyRows = await this.getRowsByDateRange(startOfMonth, now);
    const dailyRows = await this.getRowsByDateRange(startOfDay, now);
    
    const calculateCost = (rows: ExtractedRow[]) => {
      return rows
        .filter(row => row.status === 'Done' && row.apiTokensUsed)
        .reduce((total, row) => {
          const tokens = row.apiTokensUsed || 0;
          const costPerMillion = row.modelUsed === 'gpt-4o' ? 5 : 0.15;
          return total + (tokens / 1000000) * costPerMillion;
        }, 0);
    };

    const monthlyCost = calculateCost(monthlyRows);
    const dailyCost = calculateCost(dailyRows);
    
    const monthlyCompletedRows = monthlyRows.filter(row => row.status === 'Done');
    const costPerImage = monthlyCompletedRows.length > 0 ? monthlyCost / monthlyCompletedRows.length : 0;
    
    // Project monthly cost based on daily average
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const projectedMonthlyCost = dayOfMonth > 0 ? (monthlyCost / dayOfMonth) * daysInMonth : 0;
    
    // Token usage breakdown
    const gpt4oTokens = monthlyRows
      .filter(row => row.modelUsed === 'gpt-4o')
      .reduce((total, row) => total + (row.apiTokensUsed || 0), 0);
    
    const gpt4oMiniTokens = monthlyRows
      .filter(row => row.modelUsed === 'gpt-4o-mini')
      .reduce((total, row) => total + (row.apiTokensUsed || 0), 0);

    return {
      dailyCost,
      monthlyCost,
      costPerImage,
      projectedMonthlyCost,
      tokenUsageBreakdown: {
        gpt4o: gpt4oTokens,
        gpt4oMini: gpt4oMiniTokens
      }
    };
  }

  // Maintenance
  async cleanup(): Promise<void> {
    await this.init();
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const tx = this.db!.transaction('rows', 'readwrite');
    const index = tx.store.index('by-date');
    const range = IDBKeyRange.upperBound(cutoffDate);
    
    let deletedCount = 0;
    for await (const cursor of index.iterate(range)) {
      await cursor.delete();
      deletedCount++;
    }
    
    console.log(`%c[IndexedDB] Cleaned up ${deletedCount} old records`, 'color: #faad14;');
  }

  async exportData(): Promise<ExportData> {
    await this.init();
    const [rows, schemaData] = await Promise.all([
      this.getAllRows(),
      this.getSchema()
    ]);

    return {
      rows,
      schema: schemaData || [],
      metadata: {
        exportDate: new Date(),
        version: '1.0',
        rowCount: rows.length
      }
    };
  }

  async importData(data: ExportData): Promise<void> {
    await this.init();
    const tx = this.db!.transaction(['rows', 'schema'], 'readwrite');
    
    // Import rows
    for (const row of data.rows) {
      await tx.objectStore('rows').put({
        ...row,
        createdAt: new Date(row.createdAt || Date.now()),
        updatedAt: new Date()
      });
    }
    
    // Import schema
    if (data.schema.length > 0) {
      // FIXED: Correct parameter order for put method
      await tx.objectStore('schema').put({
        data: data.schema,
        updatedAt: new Date()
      }, 'current');
    }
    
    await tx.done;
    console.log(`%c[IndexedDB] Imported ${data.rows.length} rows successfully`, 'color: #52c41a;');
  }

  // Track corrections (for analytics)
  async trackCorrection(correction: {
    rowId: string;
    attributeKey: string;
    originalValue: string;
    correctedValue: string;
    reason?: string;
  }): Promise<void> {
    await this.init();
    await this.db!.put('corrections', {
      id: crypto.randomUUID(),
      ...correction,
      timestamp: new Date()
    });
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();
