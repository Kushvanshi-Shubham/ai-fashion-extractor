
import type { ExtractedRow, SchemaItem } from '../types';
import { indexedDBService } from './indexedDBService';
import { notification } from 'antd';

class MigrationService {
  private readonly LOCALSTORAGE_KEYS = {
    HISTORY: 'clothingEnrichmentDataHistory',
    SCHEMA: 'clothingEnrichmentCustomSchema'
  };

  async migrateFromLocalStorage(): Promise<{ success: boolean; migratedRows: number; error?: string }> {
    try {
      console.log('%c[Migration] Starting localStorage → IndexedDB migration', 'color: #1890ff;');
      
      // Get data from localStorage
      const historyData = localStorage.getItem(this.LOCALSTORAGE_KEYS.HISTORY);
      const schemaData = localStorage.getItem(this.LOCALSTORAGE_KEYS.SCHEMA);
      
      let migratedRows = 0;
      
      // Migrate rows
      if (historyData) {
        const rows: Omit<ExtractedRow, 'file'>[] = JSON.parse(historyData);
        
        // Convert to ExtractedRow format with dummy files
        const rowsWithFiles = rows.map(row => {
          const dummyFile = new File([], row.originalFileName || "") as any;
          dummyFile.uid = row.id;
          
          return {
            ...row,
            file: dummyFile,
            createdAt: row.createdAt || new Date()
          } as ExtractedRow;
        });
        
        await indexedDBService.saveMultipleRows(rowsWithFiles);
        migratedRows = rowsWithFiles.length;
        
        console.log(`%c[Migration] Migrated ${migratedRows} rows`, 'color: #52c41a;');
      }
      
      // Migrate schema
      if (schemaData) {
        const schema: SchemaItem[] = JSON.parse(schemaData);
        await indexedDBService.saveSchema(schema);
        console.log('%c[Migration] Migrated schema', 'color: #52c41a;');
      }
      
      // Create backup of localStorage data
      this.createLocalStorageBackup();
      
      // Clear localStorage (optional - you might want to keep it as backup)
      // localStorage.removeItem(this.LOCALSTORAGE_KEYS.HISTORY);
      // localStorage.removeItem(this.LOCALSTORAGE_KEYS.SCHEMA);
      
      notification.success({
        message: 'Migration Successful!',
        description: `Migrated ${migratedRows} images to new storage system.`,
        placement: 'bottomRight',
        duration: 5
      });
      
      return { success: true, migratedRows };
      
    } catch (error) {
      console.error('%c[Migration] Migration failed:', 'color: #ff4d4f;', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown migration error';
      
      notification.error({
        message: 'Migration Failed',
        description: errorMessage,
        placement: 'bottomRight',
        duration: 8
      });
      
      return { success: false, migratedRows: 0, error: errorMessage };
    }
  }

  private createLocalStorageBackup(): void {
    const backup = {
      timestamp: new Date().toISOString(),
      history: localStorage.getItem(this.LOCALSTORAGE_KEYS.HISTORY),
      schema: localStorage.getItem(this.LOCALSTORAGE_KEYS.SCHEMA)
    };
    
    localStorage.setItem('clothing_analyzer_backup', JSON.stringify(backup));
    console.log('%c[Migration] Created localStorage backup', 'color: #faad14;');
  }

  async checkMigrationNeeded(): Promise<boolean> {
    // Check if localStorage has data but IndexedDB doesn't
    const hasLocalStorageData = localStorage.getItem(this.LOCALSTORAGE_KEYS.HISTORY);
    
    if (!hasLocalStorageData) return false;
    
    await indexedDBService.init();
    const indexedDBRows = await indexedDBService.getAllRows();
    
    return indexedDBRows.length === 0;
  }

  async restoreFromBackup(): Promise<boolean> {
    try {
      const backup = localStorage.getItem('clothing_analyzer_backup');
      if (!backup) return false;
      
      const backupData = JSON.parse(backup);
      
      if (backupData.history) {
        localStorage.setItem(this.LOCALSTORAGE_KEYS.HISTORY, backupData.history);
      }
      
      if (backupData.schema) {
        localStorage.setItem(this.LOCALSTORAGE_KEYS.SCHEMA, backupData.schema);
      }
      
      console.log('%c[Migration] Restored from backup', 'color: #52c41a;');
      return true;
    } catch (error) {
      console.error('%c[Migration] Restore failed:', 'color: #ff4d4f;', error);
      return false;
    }
  }
}

export const migrationService = new MigrationService();
