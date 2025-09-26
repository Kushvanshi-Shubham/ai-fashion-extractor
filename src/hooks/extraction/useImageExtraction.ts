/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { message } from "antd";
import { ExtractionService } from "../../services/ai/extractionService";
import { discoveryManager } from "../../services/ai/discovery/discoveryManager";
import { ImageCompressionService } from "../../services/processing/ImageCompressionService";
import type {
  SchemaItem,
  DiscoveredAttribute,
  EnhancedExtractionResult,
  ExtractedRowEnhanced,
  DiscoverySettings,
  PerformanceMetrics,
  ExtractionError,
} from "../../types/extraction/ExtractionTypes";
import {
  getMemoryUsage,
  getMemoryInfo,
  createExtractedRow,
  compressImage,
} from "./extractionHelpers";
import { useBatchExtraction } from "./useBatchExtraction";

export const useImageExtraction = () => {
  // Core state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedRows, setExtractedRows] = useState<ExtractedRowEnhanced[]>([]);
  const [progress, setProgress] = useState(0);
  // Discovery state
  const [discoverySettings, setDiscoverySettings] = useState<DiscoverySettings>({
    enabled: true,
    minConfidence: 70,
    showInTable: true,
    autoPromote: false,
    maxDiscoveries: 10,
  });
  const [globalDiscoveries, setGlobalDiscoveries] = useState<DiscoveredAttribute[]>([]);
  // Analytics
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [extractionErrors, setExtractionErrors] = useState<ExtractionError[]>([]);
  const [batchResults] = useState<any[]>([]);

  const compressionService = useMemo(() => new ImageCompressionService(), []);

  const abortRef = useRef<AbortController | null>(null);

  const recordPerf = useCallback((metrics: PerformanceMetrics) => {
    setPerformanceMetrics((prev) => [...prev, metrics]);
  }, []);

  const compress = useCallback(
    (file: File, onProgress?: (p: number) => void): Promise<string> =>
      compressImage(file, compressionService, recordPerf, onProgress),
    [compressionService, recordPerf]
  );

  const newRow = useCallback(
    (file: File) => createExtractedRow(file, compress),
    [compress]
  );

  const extractionService = useMemo(() => new ExtractionService(compress), [compress]);

  // Extract attributes with proper error handling and user notification
  const extractImageAttributes = useCallback(
    async (
      row: ExtractedRowEnhanced,
      schema: SchemaItem[],
      categoryName?: string
    ) => {
      const discoveryEnabled = discoverySettings.enabled;
      setExtractedRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                status: "Extracting",
                processingProgress: 0,
                error: undefined,
              }
            : r
        )
      );

      const start = performance.now();
      try {
        const result: EnhancedExtractionResult =
          await extractionService.extractWithDiscovery(
            row.file,
            schema,
            categoryName ?? "",
            discoveryEnabled
          );

        const totalTime = performance.now() - start;

        const updated: ExtractedRowEnhanced = {
          ...row,
          status: "Done",
          attributes: result.attributes,
          discoveries: result.discoveries ?? [],
          apiTokensUsed: result.tokensUsed,
          modelUsed: result.modelUsed,
          extractionTime: totalTime,
          confidence: result.confidence,
          updatedAt: new Date(),
          processingProgress: 100,
        };

        setExtractedRows((prev) =>
          prev.map((r) => (r.id === row.id ? updated : r))
        );

        const discoveries = result.discoveries ?? [];
        if (discoveries.length > 0) {
          discoveryManager.addDiscoveries(discoveries, categoryName ?? "");
          setGlobalDiscoveries(discoveryManager.getDiscoveriesForCategory());
        }

        recordPerf({
          compressionTime: 0,
          apiRequestTime: result.processingTime,
          parsingTime: 0,
          totalTime,
          memoryUsed: getMemoryUsage(),
        });

        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";

        setExtractedRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  status: "Error",
                  error: msg,
                  updatedAt: new Date(),
                  processingProgress: 0,
                  retryCount: (r.retryCount || 0) + 1,
                }
              : r
          )
        );

        setExtractionErrors((prev) => [
          ...prev,
          {
            code: "EXTRACT_FAIL",
            message: msg,
            details: { fileName: row.originalFileName },
            retryable: true,
            timestamp: new Date(),
          },
        ]);

        message.error(`Extraction failed for ${row.originalFileName}: ${msg}`);

        return row;
      }
    },
    [extractionService, discoverySettings.enabled, recordPerf]
  );

  const { extractAllPending, cancelExtraction } = useBatchExtraction(
    extractedRows,
    setExtractedRows,
    extractImageAttributes,
    setProgress,
    setIsExtracting,
    recordPerf,
    abortRef
  );

  // Add images ensuring no duplicates by name
  const addImages = useCallback(
    async (files: File[]) => {
      try {
        const rows = await Promise.all(files.map(newRow));
        setExtractedRows((prev) => {
          const names = new Set(prev.map((r) => r.originalFileName));
          return [...prev, ...rows.filter((r) => !names.has(r.originalFileName))];
        });
        return rows;
      } catch (e: unknown) {
        message.error("Failed to add images.");
        return [];
      }
    },
    [newRow]
  );

  const removeRow = useCallback((id: string) => {
    setExtractedRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    abortRef.current?.abort();
    extractedRows.forEach((r) => {
      if (r.imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(r.imagePreviewUrl);
      }
    });
    setExtractedRows([]);
    discoveryManager.clear();
    setGlobalDiscoveries([]);
    setPerformanceMetrics([]);
    setExtractionErrors([]);
    setProgress(0);
    setIsExtracting(false);
  }, [extractedRows]);

  // Promote discovery to schema with success/error message
  const promoteDiscoveryToSchema = useCallback((key: string) => {
    const p = discoveryManager.promoteToSchema(key);
    if (p) {
      setGlobalDiscoveries(discoveryManager.getDiscoveriesForCategory());
      message.success(`'${p.label}' added to schema`);
    } else {
      message.error("Promotion failed");
    }
  }, []);

  // Update attribute in specific row immutably
  const updateRowAttribute = useCallback(
    (rowId: string, attributeKey: string, value: string | number | null) => {
      setExtractedRows((prev) =>
        prev.map((row) => {
          if (row.id === rowId) {
            const existingAttribute = row.attributes[attributeKey];
            const updatedAttribute = {
              rawValue: value !== null ? String(value) : null,
              schemaValue: value,
              visualConfidence: existingAttribute?.visualConfidence ?? 0,
              mappingConfidence: 100,
              isNewDiscovery: existingAttribute?.isNewDiscovery ?? false,
              reasoning: existingAttribute?.reasoning || "User edited",
            };

            return {
              ...row,
              attributes: {
                ...row.attributes,
                [attributeKey]: updatedAttribute,
              },
              updatedAt: new Date(),
            };
          }
          return row;
        })
      );
    },
    []
  );

  // Extract statistics from current rows
  const stats = useMemo(() => {
    const done = extractedRows.filter((r) => r.status === "Done").length;
    return {
      total: extractedRows.length,
      pending: extractedRows.filter((r) => r.status === "Pending").length,
      extracting: extractedRows.filter((r) => r.status === "Extracting").length,
      done,
      error: extractedRows.filter((r) => r.status === "Error").length,
      successRate:
        extractedRows.length > 0
          ? Math.round((done / extractedRows.length) * 100)
          : 0,
      discoveries: discoveryManager.getDiscoveriesForCategory().length,
    };
  }, [extractedRows]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      extractedRows.forEach((r) => {
        if (r.imagePreviewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(r.imagePreviewUrl);
        }
      });
      compressionService.destroy();
    };
     
  }, []); // On unmount only

  return {
    isExtracting,
    extractedRows,
    progress,
    addImages,
    extractImageAttributes,
    extractAllPending,
    cancelExtraction,
    removeRow,
    clearAll,
    updateRowAttribute,
    stats,
    performanceMetrics,
    extractionErrors,
    batchResults,
    discoverySettings,
    setDiscoverySettings,
    globalDiscoveries,
    promoteDiscoveryToSchema,
    getMemoryInfo,
  };
};
