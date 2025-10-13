import type {
  SchemaItem,
  ExtractionResult,
  EnhancedExtractionResult,
  OCRLabels
} from "../../types/extraction/ExtractionTypes";
import { logger } from "../../utils/common/logger";
import { BackendApiService } from "../api/backendApi";


export class ExtractionService {
  private backendApi = new BackendApiService();
  private compressImage: (file: File) => Promise<string>;

  constructor(compressImageFn: (file: File) => Promise<string>) {
    this.compressImage = compressImageFn;
  }

  async extractAttributes(
    file: File,
    schema: SchemaItem[],
    customPrompt?: string,
    categoryName?: string
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    try {
      const base64Image = await this.compressImage(file);

      logger.info("Starting AI extraction via backend", {
        fileName: file.name,
        schemaSize: schema.length,
      });

      const result = await this.backendApi.extractFromBase64({
        image: base64Image,
        schema,
        customPrompt,
        categoryName,
        discoveryMode: false
      });

      const processingTime = Date.now() - startTime;

      logger.info("Extraction completed successfully", {
        fileName: file.name,
        processingTime,
        tokensUsed: result.tokensUsed,
        confidence: result.confidence,
      });

      return {
        attributes: result.attributes,
        tokensUsed: result.tokensUsed,
        modelUsed: result.modelUsed,
        processingTime: result.processingTime,
        confidence: result.confidence
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error("Extraction failed", {
        fileName: file.name,
        processingTime,
        error,
      });
      throw error;
    }
  }

  async extractWithDiscovery(
    file: File,
    schema: SchemaItem[],
    categoryName?: string,
    discoveryMode = false
  ): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();
    try {
      const base64Image = await this.compressImage(file);

      logger.info("Starting enhanced AI extraction via backend", {
        fileName: file.name,
        schemaSize: schema.length,
        discoveryMode,
        category: categoryName,
      });

      const result = await this.backendApi.extractFromBase64({
        image: base64Image,
        schema,
        categoryName,
        discoveryMode
      });

      if (result.discoveries && result.discoveries.length > 0) {
        const { discoveryManager } = await import("./discovery/discoveryManager");
        discoveryManager.addDiscoveries(result.discoveries, categoryName);
      }

      const updatedProcessingTime = Date.now() - startTime;

      logger.info("Enhanced extraction completed", {
        fileName: file.name,
        processingTime: updatedProcessingTime,
        tokensUsed: result.tokensUsed,
        confidence: result.confidence,
        discoveries: result.discoveries?.length ?? 0,
        highConfidenceDiscoveries: result.discoveryStats?.highConfidence ?? 0,
        discoveryMode,
      });

      return {
        ...result,
        processingTime: updatedProcessingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error("Enhanced extraction failed", {
        fileName: file.name,
        processingTime,
        discoveryMode,
        error,
      });
      throw error;
    }
  }

  async extractWithDebug(
    file: File,
    schema: SchemaItem[],
    categoryName?: string
  ): Promise<EnhancedExtractionResult & { debugInfo?: unknown }> {
    try {
      const base64Image = await this.compressImage(file);

      const result = await this.backendApi.extractWithDebug({
        image: base64Image,
        schema,
        categoryName
      });

      return result;
    } catch (error) {
      const baseResult = await this.extractWithDiscovery(file, schema, categoryName, true);
      return {
        ...baseResult,
        debugInfo: {
          error: "Debug info extraction failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  // 🔍 MULTI-CROP ENHANCED EXTRACTION
  async extractWithMultiCrop(
    file: File,
    schema: SchemaItem[],
    categoryName?: string,
    department?: string,
    subDepartment?: string
  ): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();
    try {
      logger.info("Starting multi-crop AI extraction via backend", {
        fileName: file.name,
        schemaSize: schema.length,
        category: categoryName,
        department,
        subDepartment,
      });

      // Use the backend's multi-crop endpoint directly with FormData
      const result = await this.backendApi.extractWithMultiCrop({
        file,
        schema,
        categoryName,
        department,
        subDepartment
      });

      if (result.discoveries && result.discoveries.length > 0) {
        const { discoveryManager } = await import("./discovery/discoveryManager");
        discoveryManager.addDiscoveries(result.discoveries, categoryName);
      }

      const updatedProcessingTime = Date.now() - startTime;

      logger.info("Multi-crop extraction completed", {
        fileName: file.name,
        processingTime: updatedProcessingTime,
        tokensUsed: result.tokensUsed,
        confidence: result.confidence,
        discoveries: result.discoveries?.length ?? 0,
        highConfidenceDiscoveries: result.discoveryStats?.highConfidence ?? 0,
        multiCrop: true,
      });

      return {
        ...result,
        processingTime: updatedProcessingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error("Multi-crop extraction failed", {
        fileName: file.name,
        processingTime,
        error,
      });
      
      // Fallback to regular enhanced extraction
      logger.info("Falling back to standard enhanced extraction", {
        fileName: file.name,
      });
      return this.extractWithDiscovery(file, schema, categoryName, true);
    }
  }

  // 📖 OCR-ONLY TEXT EXTRACTION
  async extractOCRLabels(file: File): Promise<{
    ocrLabels: OCRLabels;
    sectionResults: {
      fullImage: OCRLabels;
      topSection: OCRLabels;
      centerSection: OCRLabels;
      bottomSection: OCRLabels;
    };
    processingTime: number;
    confidence: number;
  }> {
    try {
      logger.info("Starting OCR text extraction", {
        fileName: file.name,
      });

      const result = await this.backendApi.extractOCRLabels(file);

      logger.info("OCR extraction completed", {
        fileName: file.name,
        processingTime: result.processingTime,
        confidence: result.confidence,
        labelsFound: Object.values(result.ocrLabels).flat().length - 1,
      });

      return result;
    } catch (error) {
      logger.error("OCR extraction failed", {
        fileName: file.name,
        error,
      });
      throw error;
    }
  }


}
