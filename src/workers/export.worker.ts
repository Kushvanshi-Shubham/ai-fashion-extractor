import * as XLSX from 'xlsx';
import type { ExtractedRow } from '../types/extraction/ExtractionTypes';

interface ExportMessage {
  type: 'EXPORT';
  payload: ExtractedRow[];
}

self.onmessage = (event: MessageEvent<ExportMessage>) => {
  if (event.data.type === 'EXPORT') {
    try {
      const rows = event.data.payload;

      const dataToExport = rows
        .filter(row => row.status === 'Done' && row.attributes)
        .map(row => {
          const flatRow: { [key: string]: string | number | null } = {
            'Image_File': row.originalFileName,
            'Model_Used': row.modelUsed || 'N/A',
            'Tokens_Used': row.apiTokensUsed || 0,
            'Extraction_Time_ms': row.extractionTime || 0,
          };

          Object.keys(row.attributes).forEach(key => {
            const detail = row.attributes[key];
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            flatRow[label] = detail?.schemaValue ?? null;
          });

          return flatRow;
        });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attributes');

      const wbout = XLSX.write(workbook, { type: 'binary', bookType: 'xlsx' });

      // Convert to ArrayBuffer
      const buffer = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < wbout.length; i++) {
        view[i] = wbout.charCodeAt(i) & 0xFF;
      }

      // Cast self to DedicatedWorkerGlobalScope to fix TS error and transfer buffer ownership
      (self as DedicatedWorkerGlobalScope).postMessage(
        {
          type: 'RESULT',
          success: true,
          data: buffer,
        },
        [buffer]
      );
    } catch (error) {
      (self as DedicatedWorkerGlobalScope).postMessage({
        type: 'RESULT',
        success: false,
        error: (error as Error).message,
      });
    }
  }
};
