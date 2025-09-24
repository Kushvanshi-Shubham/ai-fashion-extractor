import type { BaseEntity, ExtractionStatus, ModelType } from '../core/CommonTypes';
import type { AttributeDefinition } from '../category/CategoryTypes';

export interface AttributeDetail {
  schemaValue: string | number | null;
  rawValue: string | null;
  isNewDiscovery: boolean;
  visualConfidence: number;
  mappingConfidence: number;
}

export interface AttributeData {
  [key: string]: AttributeDetail | null;
}

export interface ExtractedRow extends BaseEntity {
  file: File;
  originalFileName: string;
  imagePreviewUrl: string;
  status: ExtractionStatus;
  attributes: AttributeData;
  apiTokensUsed?: number;
  modelUsed?: ModelType;
  extractionTime?: number;
  error?: string;
}

export type SchemaItem = AttributeDefinition

export interface ExtractionResult {
  attributes: AttributeData;
  tokensUsed: number;
  modelUsed: ModelType;
  processingTime: number;
  confidence: number;
}

export interface BulkExtractionOptions {
  batchSize: number;
  maxConcurrency: number;
  retryAttempts: number;
  progressCallback?: (progress: number) => void;
}
