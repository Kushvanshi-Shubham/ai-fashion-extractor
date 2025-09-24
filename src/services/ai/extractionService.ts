
import { BaseApiService } from '../api/baseApi';
import type { ExtractionResult, SchemaItem, AttributeData } from '../../types/extraction/ExtractionTypes';
import { ImageProcessor } from '../../utils/extraction/imageProcessing';
import { PromptService } from './promptService';
import { ResponseParser } from './responseParser';

// ✅ ADD: OpenAI API response types
interface OpenAIMessage {
  role: string;
  content: string;
}

interface OpenAIChoice { 
  message: OpenAIMessage;
  finish_reason: string;
  index: number;
}

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
}

export class ExtractionService extends BaseApiService {
  private promptService: PromptService;
  private responseParser: ResponseParser;
  private imageProcessor: ImageProcessor;

  constructor() {
    super();
    this.promptService = new PromptService();
    this.responseParser = new ResponseParser();
    this.imageProcessor = new ImageProcessor();
  }

  async extractAttributes(
    file: File, 
    schema: SchemaItem[], 
    customPrompt?: string
  ): Promise<ExtractionResult> {
    const startTime = performance.now();
    
    // Process image
    const base64Image = await this.imageProcessor.processImage(file);
    
    // Generate prompt
    const prompt = customPrompt || this.promptService.generateGenericPrompt(schema);
    
    // Make API call
    const payload = {
      model: 'gpt-4o',
      messages: [{
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: prompt },
          { type: 'image_url' as const, image_url: { url: base64Image } }
        ]
      }],
      max_tokens: 2048,
      temperature: 0.1,
      response_format: { type: 'json_object' as const }
    };

    const response = await this.retryRequest(async () => {
      return this.makeRequest<OpenAIResponse>('/chat/completions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Extraction failed');
    }

    // ✅ FIX: Now properly typed
    const openAIData = response.data;
    
    // Parse response
    const attributes = await this.responseParser.parseResponse(
      openAIData.choices[0].message.content, 
      schema
    );

    const processingTime = performance.now() - startTime;

    return {
      attributes,
      tokensUsed: openAIData.usage?.total_tokens || 0,
      modelUsed: 'gpt-4o',
      processingTime,
      confidence: this.calculateConfidence(attributes)
    };
  }

  // ✅ FIX: Properly typed confidence calculation
  private calculateConfidence(attributes: AttributeData): number {
    const confidences = Object.values(attributes)
      .filter(attr => attr !== null && attr !== undefined)
      .map(attr => attr!.visualConfidence || 0);
    
    return confidences.length > 0 
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
      : 0;
  }
}
