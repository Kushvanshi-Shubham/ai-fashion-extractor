import { MASTER_ATTRIBUTES } from '../../constants/categories/masterAttributes';
import type { AttributeDefinition, CategoryConfig } from '../../types/category/CategoryTypes';
import type { SchemaItem } from '../../types/extraction/ExtractionTypes';
import { logger } from '../common/logger';

// Centralized configuration for required attributes by category pattern
const ALWAYS_REQUIRED = new Set(['add_acc1', 'micro_mvgr', 'color_main', 'size']);
const FABRIC_REQUIRED = new Set(['fab_division', 'fab_yarn_01']);
const CATEGORY_REQUIRED_RULES: Record<string, Set<string>> = {
  'JEANS': new Set(['wash']),
  'T_SHIRT': new Set(['neck']),
};

// Utility to check if attribute is required given category context
function isAttributeRequired(attributeKey: string, categoryConfig: CategoryConfig): boolean {
  if (ALWAYS_REQUIRED.has(attributeKey) || FABRIC_REQUIRED.has(attributeKey)) return true;

  for (const [categoryPattern, keys] of Object.entries(CATEGORY_REQUIRED_RULES)) {
    if (categoryConfig.category.includes(categoryPattern) && keys.has(attributeKey)) {
      return true;
    }
  }

  return false;
}

// Optimized duplicate key check using Set
function findDuplicateKeys(schema: SchemaItem[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of schema) {
    if (seen.has(item.key)) {
      duplicates.add(item.key);
    } else {
      seen.add(item.key);
    }
  }

  return Array.from(duplicates);
}

export class UnifiedSchemaGenerator {
  /**
   * Generate UI schema from category config. Prioritizes required attributes,
   * supports options to limit items and include optional attrs.
   */
  public static generateUISchema(
    category: CategoryConfig,
    options: {
      includeOptional?: boolean;
      maxItems?: number;
      prioritizeRequired?: boolean;
    } = {},
  ): SchemaItem[] {
    const {
      includeOptional = true,
      maxItems = 50,
      prioritizeRequired = true,
    } = options;

    try {
      logger.debug('Generating UI schema', {
        categoryId: category.id,
        categoryName: category.displayName,
        options,
      });

      let entries = Object.entries(category.attributes);

      // Prioritize required attributes if requested
      if (prioritizeRequired) {
        entries = entries.sort(([, a], [, b]) => {
          if (a && !b) return -1;
          if (!a && b) return 1;
          return 0;
        });
      }

      const schema: SchemaItem[] = [];

      for (const [key, isEnabled] of entries) {
        if (!isEnabled && !includeOptional) continue;
        if (schema.length >= maxItems) {
          logger.warn('Max schema items reached', { categoryId: category.id, maxItems });
          break;
        }

        const masterAttr: AttributeDefinition | undefined = MASTER_ATTRIBUTES[key];
        if (!masterAttr) {
          logger.warn('Unknown attribute key skipped', { key, category: category.category });
          continue;
        }

        const required = isAttributeRequired(key, category);

        const {
          key: attrKey,
          label,
          fullForm,
          type,
          allowedValues = []
        } = masterAttr;

        schema.push({
          key: attrKey,
          label,
          fullForm,
          type,
          allowedValues: type === 'select' ? allowedValues.slice(0, 10) : undefined,
          required,
          description: UnifiedSchemaGenerator.optimizeDescriptionForAI(
            masterAttr.description ?? UnifiedSchemaGenerator.formatLabel(attrKey),
          ),
        });
      }

      logger.info('Generated UI schema', {
        categoryId: category.id,
        length: schema.length,
        requiredCount: schema.filter(item => item.required).length,
      });

      return schema;
    } catch (error) {
      logger.error('Schema generation error', {
        categoryId: category.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Convert category attribute booleans to schema items, using MASTER_ATTRIBUTES as reference
   */
  public static deriveSchemaFromCategoryAttributes(attributes: Record<string, boolean>): SchemaItem[] {
    const schema: SchemaItem[] = [];

    for (const [key, enabled] of Object.entries(attributes)) {
      if (enabled && MASTER_ATTRIBUTES[key]) {
        const attrDef: AttributeDefinition = MASTER_ATTRIBUTES[key];
        schema.push({
          key: attrDef.key,
          label: attrDef.label,
          fullForm: attrDef.fullForm,
          type: attrDef.type,
          allowedValues: attrDef.allowedValues || [],
          required: false,
          description: attrDef.description,
        });
      }
    }

    return schema;
  }

  /**
   * Simple utility: format camelCase or snake_case keys to readable labels
   */
  private static formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  /**
   * For text description, truncate intelligently for AI token efficiency
   */
  private static optimizeDescriptionForAI(description: string): string {
    const maxLength = 100;
    if (description.length <= maxLength) return description;

    const sentences = description.split('. ');
    let summary = sentences[0];

    for (let i = 1; i < sentences.length; i++) {
      if (summary.length + sentences[i].length + 2 > maxLength) break;
      summary += '. ' + sentences[i];
    }

    return summary.endsWith('.') ? summary : summary + '.';
  }

  /**
   * Validate schema for missing keys, labels, types, duplicates
   */
  public static validateSchema(schema: SchemaItem[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (schema.length === 0) errors.push('Schema is empty.');

    for (const [index, item] of schema.entries()) {
      if (!item.key) errors.push(`Missing key at index ${index}`);
      if (!item.label) errors.push(`Missing label at index ${index}`);

      if (!['text', 'select', 'number', 'boolean'].includes(item.type)) {
        errors.push(`Invalid type '${item.type}' at index ${index}`);
      }

      if (item.type === 'select' && (!item.allowedValues || item.allowedValues.length === 0)) {
        warnings.push(`Select item "${item.key}" has no allowed values`);
      }
    }

    const duplicates = findDuplicateKeys(schema);
    if (duplicates.length > 0) errors.push(`Duplicate keys found: ${duplicates.join(', ')}`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Legacy compatibility exports
export const generateSchemaFromCategory = UnifiedSchemaGenerator.generateUISchema.bind(UnifiedSchemaGenerator);
