import type {
  SchemaItem,
  ExtractionResult,
  AttributeData,
  AttributeDetail,
  DiscoveredAttribute,
  EnhancedExtractionResult
} from "../../types/extraction/ExtractionTypes";
import { PromptService } from "./promptService";
import { logger } from "../../utils/common/logger";
import { ApiService } from "../api/apiServices";
import { ResponseParser } from "./responseParser";


export class ExtractionService {
  private promptService = new PromptService();
  private responseParser = new ResponseParser();
  private apiService = new ApiService();
  private compressImage: (file: File) => Promise<string>;

  constructor(compressImageFn: (file: File) => Promise<string>) {
    this.compressImage = compressImageFn;
  }

  // Removed unused enabled param
  async extractAttributes(
    file: File,
    schema: SchemaItem[],
    customPrompt?: string,
    categoryName?: string
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    try {
      const base64Image = await this.compressImage(file);

      const prompt =
        customPrompt ||
        (categoryName
          ? this.promptService.generateCategorySpecificPrompt(schema, categoryName)
          : this.promptService.generateGenericPrompt(schema));

      logger.info("Starting AI extraction", {
        fileName: file.name,
        schemaSize: schema.length,
        promptLength: prompt.length,
      });

      const aiResponse = await this.apiService.callVisionAPI(base64Image, prompt);

      const attributes: AttributeData = await this.responseParser.parseResponse(
        aiResponse.content,
        schema
      );

      const processingTime = Date.now() - startTime;

      const result: ExtractionResult = {
        attributes,
        tokensUsed: aiResponse.tokensUsed,
        modelUsed: aiResponse.modelUsed,
        processingTime,
        confidence: this.calculateOverallConfidence(attributes),
      };

      logger.info("Extraction completed successfully", {
        fileName: file.name,
        processingTime,
        tokensUsed: result.tokensUsed,
        confidence: result.confidence,
      });

      return result;
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

      const prompt = discoveryMode
        ? this.promptService.generateDiscoveryPrompt(schema, categoryName)
        : categoryName
        ? this.promptService.generateCategorySpecificPrompt(schema, categoryName)
        : this.promptService.generateGenericPrompt(schema);

      logger.info("Starting enhanced AI extraction", {
        fileName: file.name,
        schemaSize: schema.length,
        discoveryMode,
        category: categoryName,
        promptLength: prompt.length,
      });

      const aiResponse = await this.apiService.callVisionAPI(base64Image, prompt);

      let attributes: AttributeData;
      let discoveries: DiscoveredAttribute[] = [];

      if (discoveryMode) {
        const enhancedResult = await this.responseParser.parseEnhancedResponse(
          aiResponse.content,
          schema
        );
        attributes = enhancedResult.attributes;
        discoveries = enhancedResult.discoveries;

        if (discoveries.length > 0) {
          const { discoveryManager } = await import("./discovery/discoveryManager");
          discoveryManager.addDiscoveries(discoveries, categoryName);
        }
      } else {
        attributes = await this.responseParser.parseResponse(
          aiResponse.content,
          schema
        );
      }

      const processingTime = Date.now() - startTime;

      const result: EnhancedExtractionResult = {
        attributes,
        discoveries,
        tokensUsed: aiResponse.tokensUsed,
        modelUsed: aiResponse.modelUsed,
        processingTime,
        confidence: this.calculateOverallConfidence(attributes),
        discoveryStats: {
          totalFound: discoveries.length,
          highConfidence: discoveries.filter((d) => d.confidence >= 80).length,
          schemaPromotable: discoveries.filter((d) => d.confidence >= 75).length,
          uniqueKeys: [...new Set(discoveries.map((d) => d.key))].length,
        },
      };

      logger.info("Enhanced extraction completed", {
        fileName: file.name,
        processingTime,
        tokensUsed: result.tokensUsed,
        confidence: result.confidence,
        discoveries: discoveries.length,
        highConfidenceDiscoveries: result.discoveryStats?.highConfidence ?? 0,
        discoveryMode,
      });

      return result;
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
    const baseResult = await this.extractWithDiscovery(file, schema, categoryName, true);
    try {
      const base64Image = await this.compressImage(file);
      const prompt = this.promptService.generateDiscoveryPrompt(schema, categoryName);
      const aiResponse = await this.apiService.callVisionAPI(base64Image, prompt);

      const { debugInfo } = await this.responseParser.parseWithDebugInfo(
        aiResponse.content,
        schema
      );

      return { ...baseResult, debugInfo };
    } catch (error) {
      return {
        ...baseResult,
        debugInfo: {
          error: "Debug info extraction failed",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  private calculateOverallConfidence(attributes: AttributeData): number {
    const confidenceValues = Object.values(attributes)
      .filter((attr): attr is AttributeDetail => attr !== null)
      .map((attr) => attr.visualConfidence)
      .filter((conf) => conf > 0);

    if (confidenceValues.length === 0) return 0;

    return Math.round(
      confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length
    );
  }
}
