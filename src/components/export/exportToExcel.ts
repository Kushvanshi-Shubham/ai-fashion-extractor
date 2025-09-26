import { notification } from 'antd';
import { saveAs } from 'file-saver';
import type { ExtractedRow } from '../../types/extraction/ExtractionTypes';
import type { ExportResult, ExportMessage } from '../../types/worker.types';

const exportWorker = new Worker(new URL('../../workers/export.worker.ts', import.meta.url), { type: 'module' });

export const exportToExcel = (rows: ExtractedRow[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    exportWorker.postMessage({ type: 'EXPORT', payload: rows } as unknown as ExportMessage);
    exportWorker.onmessage = (event: MessageEvent<ExportResult>) => {
      if (event.data.success) {
        const arrayBuffer = event.data.data!;
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        saveAs(blob, 'ClothingAttributes_Export.xlsx');
        resolve();
      } else {
        notification.error({
          message: 'Failed to export data',
          description: event.data.error || 'Unknown error occurred'
        });
        reject(new Error(event.data.error));
      }
    };
  });
};
