import type { SchemaItem, AttributeDetail, AttributeData } from '../../types/extraction/ExtractionTypes';

export interface ParsedAIAttribute {
  rawValue: string | null;
  schemaValue: string | number | null;
  visualConfidence: number;
  reasoning?: string;
}

export class ResponseParser {
  async parseResponse(
    aiResponse: string,
    schema: SchemaItem[]
  ): Promise<AttributeData> {
    try {
      const cleanedResponse = this.cleanMarkdownJson(aiResponse);
      const parsed = JSON.parse(cleanedResponse);
      const result: AttributeData = {};

      for (const schemaItem of schema) {
        const aiAttribute: ParsedAIAttribute | undefined = parsed[schemaItem.key];

        if (aiAttribute) {
          const attributeDetail: AttributeDetail = {
            rawValue: aiAttribute.rawValue || null,
            schemaValue: this.normalizeValue(aiAttribute.schemaValue, schemaItem),
            visualConfidence: aiAttribute.visualConfidence || 0,
            mappingConfidence: 100,
            isNewDiscovery: false,
            reasoning: aiAttribute.reasoning,
          };

          result[schemaItem.key] = attributeDetail;
        } else {
          result[schemaItem.key] = {
            rawValue: null,
            schemaValue: null,
            visualConfidence: 0,
            mappingConfidence: 0,
            isNewDiscovery: false,
            reasoning: undefined,
          };
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private cleanMarkdownJson(response: string): string {
    let cleaned = response.trim();

    // Correctly handle markdown code blocks like ```json ... ``` or ``` ... ```
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }

    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    return cleaned.trim();
  }

  private normalizeValue(value: unknown, schemaItem: SchemaItem): string | number | null {
    if (value === null || value === undefined) return null;

    const stringValue = String(value).trim();
    if (!stringValue) return null;

    switch (schemaItem.type) {
      case 'number':
        { const numValue = Number(stringValue);
        return isNaN(numValue) ? null : numValue; }

      case 'select':
        if (schemaItem.allowedValues && schemaItem.allowedValues.length > 0) {
          const normalizedValue = this.findBestMatch(stringValue, schemaItem.allowedValues);
          return normalizedValue;
        }
        return stringValue;

      case 'text':
      default:
        return stringValue;
    }
  }

  private findBestMatch(value: string, allowedValues: string[]): string | null {
    const normalizedValue = value.toLowerCase().trim();

    const exactMatch = allowedValues.find(v => v.toLowerCase() === normalizedValue);
    if (exactMatch) return exactMatch;

    const partialMatch = allowedValues.find(v =>
      v.toLowerCase().includes(normalizedValue) ||
      normalizedValue.includes(v.toLowerCase())
    );
    if (partialMatch) return partialMatch;

    return null;
  }
}