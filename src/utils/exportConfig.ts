export const exportConfig = {
  // Export data with analytics
  generateReport: async () => {
    const { indexedDBService } = await import('../services/indexedDBService');
    const { analyticsService } = await import('../services/analyticsService');
    
    const [data, stats, cost] = await Promise.all([
      indexedDBService.exportData(),
      analyticsService.getBasicStats(),
      analyticsService.getCostBreakdown()
    ]);
    
    return {
      ...data,
      analytics: {
        processingStats: stats,
        costAnalytics: cost,
        exportTimestamp: new Date().toISOString()
      }
    };
  },
  
  // Generate CSV with enhanced data
  generateCSV: async () => {
    const report = await exportConfig.generateReport();
    
    const csvRows = [
      // Header
      [
        'ID', 'Filename', 'Status', 'Processing Time (ms)', 'Tokens Used', 'Model Used', 'Cost ($)',
        ...report.schema.map(s => s.label)
      ].join(','),
      
      // Data rows
      ...report.rows.map(row => [
        row.id,
        `"${row.originalFileName}"`,
        row.status,
        row.extractionTime || '',
        row.apiTokensUsed || '',
        row.modelUsed || '',
        row.apiTokensUsed ? ((row.apiTokensUsed / 1000000) * (row.modelUsed === 'gpt-4o' ? 5 : 0.15)).toFixed(6) : '',
        ...report.schema.map(s => {
          const value = row.attributes[s.key]?.schemaValue;
          return value ? `"${value}"` : '';
        })
      ].join(','))
    ];
    
    return csvRows.join('\n');
  }
};
