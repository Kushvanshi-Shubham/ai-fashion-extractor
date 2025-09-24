import type { SchemaItem, ExtractionResult, AttributeData, AttributeDetail } from '../../types/extraction/ExtractionTypes';
import { PromptService } from './promptService';
import { logger } from '../../utils/common/logger';
import { ApiService } from '../api/apiServices';
import { ResponseParser } from './responseParser';

export class ExtractionService {
  private promptService = new PromptService();
  private responseParser = new ResponseParser();
  private apiService = new ApiService();
  private compressImage: (file: File) => Promise<string>;

  // Fix: Proper constructor syntax
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
      // Compress image
      const base64Image = await this.compressImage(file);
      
      // Generate prompt
      const prompt = customPrompt || (categoryName 
        ? this.promptService.generateCategorySpecificPrompt(schema, categoryName)
        : this.promptService.generateGenericPrompt(schema)
      );

      logger.info('Starting AI extraction', { 
        fileName: file.name, 
        schemaSize: schema.length,
        promptLength: prompt.length 
      });

      // Call AI API
      const aiResponse = await this.apiService.callVisionAPI(base64Image, prompt);
      
      // Parse response (this returns properly typed AttributeData now)
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
        confidence: this.calculateOverallConfidence(attributes)
      };

      logger.info('Extraction completed successfully', {
        fileName: file.name,
        processingTime,
        tokensUsed: result.tokensUsed,
        confidence: result.confidence
      });

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Extraction failed', { fileName: file.name, processingTime, error });
      throw error;
    }
  }

  private calculateOverallConfidence(attributes: AttributeData): number {
    const confidenceValues = Object.values(attributes)
      .filter((attr): attr is AttributeDetail => attr !== null)
      .map(attr => attr.visualConfidence)
      .filter(conf => conf > 0);

    if (confidenceValues.length === 0) return 0;
    
    return Math.round(confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length);
  }
}
