import type { SchemaItem, AttributeData, DiscoveredAttribute, EnhancedAIResponse, ParsedDiscoveryAttribute } from '../../types/extraction/ExtractionTypes';
import { logger } from '../../utils/common/logger';

export interface ParsedAIAttribute {
  rawValue: string | null;
  schemaValue: string | number | null;
  visualConfidence: number;
  reasoning?: string;
}

export class ResponseParser {
  async parseResponse(aiResponse: string, schema: SchemaItem[]): Promise<AttributeData> {
    try {
      const cleanedResponse = this.cleanMarkdownJson(aiResponse);
      const parsed = JSON.parse(cleanedResponse);
      const result: AttributeData = {};

      for (const schemaItem of schema) {
        const aiAttribute: ParsedAIAttribute | undefined = parsed[schemaItem.key];
        if (aiAttribute) {
          result[schemaItem.key] = {
            rawValue: aiAttribute.rawValue || null,
            schemaValue: this.normalizeValue(aiAttribute.schemaValue, schemaItem),
            visualConfidence: aiAttribute.visualConfidence || 0,
            mappingConfidence: 100,
            isNewDiscovery: false,
            reasoning: aiAttribute.reasoning,
          };
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
      logger.error('Failed to parse legacy AI response', { error, rawResponse: aiResponse.substring(0, 500) });
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async parseEnhancedResponse(aiResponse: string, schema: SchemaItem[]): Promise<{ attributes: AttributeData; discoveries: DiscoveredAttribute[] }> {
    try {
      const cleanedResponse = this.cleanMarkdownJson(aiResponse);
      const parsed = JSON.parse(cleanedResponse) as EnhancedAIResponse;

      logger.info('Parsing enhanced AI response', {
        hasSchemaAttributes: !!parsed.schemaAttributes,
        hasDiscoveries: !!parsed.discoveries,
        discoveryCount: Object.keys(parsed.discoveries || {}).length,
      });

      const attributes = await this.parseSchemaAttributes(parsed, schema);
      const discoveries = this.parseDiscoveries(parsed.discoveries || {});

      logger.info('Enhanced parsing completed', {
        schemaAttributesProcessed: Object.keys(attributes).length,
        discoveriesFound: discoveries.length,
        highConfidenceDiscoveries: discoveries.filter((d) => d.confidence >= 80).length,
      });

      return { attributes, discoveries };
    } catch (error) {
      logger.warn('Enhanced parsing failed, falling back to schema-only', { error });
      const attributes = await this.parseResponse(aiResponse, schema);
      return { attributes, discoveries: [] };
    }
  }

  private async parseSchemaAttributes(parsed: EnhancedAIResponse, schema: SchemaItem[]): Promise<AttributeData> {
    const result: AttributeData = {};
    // Safely handle both enhanced format (with schemaAttributes key) and legacy format (flat object)
    const schemaData = parsed.schemaAttributes ?? (parsed as Record<string, ParsedAIAttribute>);

    for (const schemaItem of schema) {
      const aiAttribute = schemaData[schemaItem.key];
      if (aiAttribute) {
        result[schemaItem.key] = {
          rawValue: aiAttribute.rawValue || null,
          schemaValue: this.normalizeValue(aiAttribute.schemaValue ?? aiAttribute.rawValue, schemaItem),
          visualConfidence: aiAttribute.visualConfidence || 0,
          mappingConfidence: 100,
          isNewDiscovery: false,
          reasoning: aiAttribute.reasoning,
        };
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
  }

  private parseDiscoveries(discoveryData: Record<string, ParsedDiscoveryAttribute>): DiscoveredAttribute[] {
    const discoveries: DiscoveredAttribute[] = [];
    for (const [key, discovery] of Object.entries(discoveryData)) {
      if ((discovery.confidence || 0) < 50 || !discovery.normalizedValue?.trim()) {
        continue;
      }

      if (!this.isValidDiscoveryKey(key)) {
        logger.warn('Invalid discovery key format, skipping', { key });
        continue;
      }

      const discoveredAttribute: DiscoveredAttribute = {
        key,
        label: this.generateLabel(key),
        rawValue: discovery.rawValue || '',
        normalizedValue: this.cleanValue(discovery.normalizedValue),
        confidence: Math.min(Math.max(discovery.confidence || 0, 0), 100), // Clamp 0-100
        reasoning: discovery.reasoning || 'No reasoning provided',
        frequency: 1,
        suggestedType: discovery.suggestedType || this.inferType(discovery.normalizedValue),
        possibleValues: discovery.possibleValues?.filter((v): v is string => typeof v === 'string' && v.trim() !== '') || undefined,
      };
      discoveries.push(discoveredAttribute);
    }
    return discoveries.sort((a, b) => b.confidence - a.confidence);
  }

  private isValidDiscoveryKey(key: string): boolean {
    const keyPattern = /^[a-z][a-z0-9_]{2,29}$/;
    return keyPattern.test(key) && !key.startsWith('_') && !key.endsWith('_');
  }

  private generateLabel(key: string): string {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private cleanValue(value: string): string {
    if (!value) return '';
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-./()]/g, '')
      .substring(0, 100);
  }

  private inferType(value: string): 'text' | 'select' | 'number' {
    if (!value) return 'text';
    const trimmedValue = value.trim();
    if (!isNaN(Number(trimmedValue)) && trimmedValue.length < 10 && trimmedValue.length > 0) {
      return 'number';
    }
    if (this.looksLikeCategory(trimmedValue)) {
      return 'select';
    }
    return 'text';
  }

  private looksLikeCategory(value: string): boolean {
    const trimmedValue = value.trim();
    return (
      trimmedValue.length <= 50 &&
      trimmedValue.length >= 2 &&
      !trimmedValue.includes('.') &&
      trimmedValue.split(' ').length <= 4 &&
      !/\d{2,}/.test(trimmedValue)
    );
  }

  async parseWithDebugInfo(aiResponse: string, schema: SchemaItem[]): Promise<{ attributes: AttributeData; discoveries: DiscoveredAttribute[]; debugInfo: any; }> {
    try {
      const cleanedResponse = this.cleanMarkdownJson(aiResponse);
      const parsed = JSON.parse(cleanedResponse);
      const { attributes, discoveries } = await this.parseEnhancedResponse(aiResponse, schema);

      const schemaKeys = schema.map((s) => s.key);
      const aiKeys = Object.keys(parsed.schemaAttributes || parsed);
      const discoveryKeys = Object.keys(parsed.discoveries || {});

      const debugInfo = {
        totalAIKeys: aiKeys.length,
        schemaKeys: schemaKeys.length,
        discoveryKeys: discoveryKeys.length,
        mappedToSchema: aiKeys.filter((key) => schemaKeys.includes(key)).length,
        unmappedFromSchema: aiKeys.filter((key) => !schemaKeys.includes(key)),
        validDiscoveries: discoveries.length,
        rawResponse: cleanedResponse.substring(0, 500) + '...',
        responseStructure: {
          hasSchemaAttributes: !!parsed.schemaAttributes,
          hasDiscoveries: !!parsed.discoveries,
          isEnhancedFormat: !!(parsed.schemaAttributes && parsed.discoveries),
        },
      };

      logger.info('Debug parsing completed', debugInfo);
      return { attributes, discoveries, debugInfo };
    } catch (error) {
      logger.error('Debug parsing failed', { error });
      const attributes = await this.parseResponse(aiResponse, schema);
      return {
        attributes,
        discoveries: [],
        debugInfo: { error: 'Parsing failed', message: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }
  
  private cleanMarkdownJson(response: string): string {
    let cleaned = response.trim();
    // Handles ```json, ```, etc., at the start of the string
    const startMatch = cleaned.match(/^```(\w*\n)?/);
    if (startMatch) {
      cleaned = cleaned.substring(startMatch[0].length);
    }
    // Handles ``` at the end of the string
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
      case 'number': {
        const numValue = Number(stringValue.replace(/[^0-9.-]+/g, ''));
        return isNaN(numValue) ? null : numValue;
      }
      case 'select':
        if (schemaItem.allowedValues && schemaItem.allowedValues.length > 0) {
          return this.findBestMatch(stringValue, schemaItem.allowedValues);
        }
        return stringValue;
      case 'text':
      default:
        return stringValue;
    }
  }

  private findBestMatch(value: string, allowedValues: string[]): string | null {
    const normalizedValue = value.toLowerCase().trim();
    const exactMatch = allowedValues.find((v) => v.toLowerCase() === normalizedValue);
    if (exactMatch) return exactMatch;

    const partialMatch = allowedValues.find(
      (v) => v.toLowerCase().includes(normalizedValue) || normalizedValue.includes(v.toLowerCase())
    );
    if (partialMatch) return partialMatch;

    return null;
  }
}

