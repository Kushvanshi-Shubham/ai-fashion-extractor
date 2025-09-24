import { MASTER_ATTRIBUTES } from '../../constants/categories/masterAttributes';
import type { AttributeDefinition } from '../../types/category/CategoryTypes';
import type { SchemaItem } from '../../types/extraction/ExtractionTypes';

/**
 * Converts category attribute boolean flags to an array of schema items
 * Filters attributes that are enabled and maps to MASTER_ATTRIBUTES definitions.
 */
export function deriveSchemaFromCategoryAttributes(attributes: Record<string, boolean>): SchemaItem[] {
  const schema: SchemaItem[] = [];

  for (const [key, enabled] of Object.entries(attributes)) {
    if (enabled && MASTER_ATTRIBUTES[key]) {
      const attrDef: AttributeDefinition = MASTER_ATTRIBUTES[key];
      schema.push({
        key: attrDef.key,
        label: attrDef.label,
        type: attrDef.type,
        allowedValues: attrDef.allowedValues || [],
      });
    }
  }

  return schema;
}
