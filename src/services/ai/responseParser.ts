import type { AttributeData, SchemaItem } from '../../types/extraction/ExtractionTypes';

export class ResponseParser {
  async parseResponse(content: string, schema: SchemaItem[]): Promise<AttributeData> {
    try {
      const rawResponse = JSON.parse(content);
      return this.convertToAttributeData(rawResponse, schema);
    } catch (error) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }
  }

  private convertToAttributeData(simpleAttributes: Record<string, unknown>, schema: SchemaItem[]): AttributeData {
    const result: AttributeData = {};

    for (const schemaItem of schema) {
      const value = simpleAttributes[schemaItem.key];
      
      result[schemaItem.key] = {
        schemaValue: this.processValue(value, schemaItem),
        rawValue: value === null || value === undefined ? null : String(value),
        isNewDiscovery: this.isNewDiscovery(value, schemaItem),
        visualConfidence: this.calculateVisualConfidence(value),
        mappingConfidence: this.calculateMappingConfidence(value, schemaItem)
      };
    }

    return result;
  }

  private processValue(value: unknown, schemaItem: SchemaItem): string | number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (schemaItem.type === 'number') {
      const numValue = Number(value);
      return isNaN(numValue) ? null : numValue;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    return String(value);
  }

  private isNewDiscovery(value: unknown, schemaItem: SchemaItem): boolean {
    if (!schemaItem.allowedValues || value === null || value === undefined) {
      return false;
    }

    const stringValue = String(value).toLowerCase();
    return !schemaItem.allowedValues.some(allowed => 
      allowed.toLowerCase() === stringValue
    );
  }

  private calculateVisualConfidence(value: unknown): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    const stringValue = String(value).toLowerCase();
    if (stringValue.includes('unknown') || stringValue.includes('unclear')) {
      return 30;
    }
    
    return 95;
  }

  private calculateMappingConfidence(value: unknown, schemaItem: SchemaItem): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (!schemaItem.allowedValues) {
      return 90; // Free text fields
    }

    const stringValue = String(value).toLowerCase();
    const exactMatch = schemaItem.allowedValues.some(allowed => 
      allowed.toLowerCase() === stringValue
    );

    return exactMatch ? 95 : 70;
  }
}
