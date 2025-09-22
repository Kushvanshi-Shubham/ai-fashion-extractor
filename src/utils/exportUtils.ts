import * as XLSX from 'xlsx';
import { notification } from 'antd';
import type { ExtractedRow } from '../types';

export const exportToExcel = (rows: ExtractedRow[]) => {
    const dataToExport = rows
        .filter(row => row.status === 'Done')
        .map(row => {
            const flatRow: { [key: string]: string | number | null } = {
                // FIX: Use the preserved original file name for export
                'Image_File': row.originalFileName,
                'Model_Used': row.modelUsed || 'N/A',
                'Tokens_Used': row.apiTokensUsed || 0,
                'Extraction_Time_ms': row.extractionTime || 0,
            };
            // Use the schema from the row's attributes to build the columns dynamically
            Object.keys(row.attributes).forEach(key => {
                const detail = row.attributes[key];
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Simple label generation
                flatRow[label] = detail?.schemaValue ?? null;
            });
            return flatRow;
        });

    if (dataToExport.length === 0) {
        notification.warning({ message: 'No completed data to export!', placement: 'bottomRight' });
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attributes");
    XLSX.writeFile(workbook, "ClothingAttributes_Export.xlsx");
};

