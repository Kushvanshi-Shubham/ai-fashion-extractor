import React, { useState } from 'react';
import { Button, notification } from 'antd';
import type { ExtractedRow } from '../types/extraction/ExtractionTypes';
import { exportToExcel } from './export/exportToExcel';

interface ExportButtonProps {
  extractedRows: ExtractedRow[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({ extractedRows }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportToExcel(extractedRows);
      notification.success({
        message: 'Export Successful',
        description: 'Your data has been exported successfully.'
      });
    } catch {
      notification.error({
        message: 'Export Failed',
        description: 'An error occurred during export. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="primary" onClick={handleExport} loading={loading}>
      Export Data to Excel
    </Button>
  );
};
