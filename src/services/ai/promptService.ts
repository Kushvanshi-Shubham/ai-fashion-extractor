import type { SchemaItem } from '../../types/extraction/ExtractionTypes';
import type { CategoryConfig } from '../../types/category/CategoryTypes';

export class PromptService {
  generateGenericPrompt(schema: SchemaItem[]): string {

    const example = {
      "neck": "Round",
      "pattern": "Solid", 
      "color_main": "Blue"
    };
 
    return `You are analyzing a clothing item. Extract these attributes with precision:

EXTRACT ONLY these relevant attributes:
${schema.map(attr => attr.label).join(', ')}

CRITICAL RULES:
- ONLY extract attributes that actually apply to this specific garment type
- If an attribute doesn't apply, return null
- Use simple, direct values - no complex objects
- Be precise and factual based on what you can see

Return a simple JSON object with ONLY these keys:
{
${schema.map(attr => `  "${attr.key}": "simple_value_or_null"`).join(',\n')}
}

Examples: ${JSON.stringify(example, null, 2)}

Analyze the clothing item and provide simple values for all listed attributes.`;
  }

  generateCategoryPrompt(categoryConfig: CategoryConfig, schema: SchemaItem[]): string {
    const categoryContext = this.getCategoryContext(categoryConfig);

    return `You are analyzing a ${categoryConfig.displayName} (${categoryConfig.category}) clothing item.

${categoryContext}

EXTRACT ONLY these ${schema.length} relevant attributes:
${schema.map(attr => attr.label).join(', ')}

CRITICAL RULES FOR ${categoryConfig.displayName.toUpperCase()}:
- Use simple, direct values matching the expected format
- Return null for truly non-applicable attributes

Return a simple JSON object:
{
${schema.map(attr => `  "${attr.key}": "detected_value_or_null"`).join(',\n')}
}

Analyze this ${categoryConfig.displayName} and provide accurate values for all ${schema.length} attributes.`;
  }

  private getCategoryContext(categoryConfig: CategoryConfig): string {
    const category = categoryConfig.category.toLowerCase();
    
    if (category.includes('t_shirt') || category.includes('tee')) {
      return 'This is a t-shirt. Focus on neck style, sleeve type, fit, print design, and fabric details.';
    } else if (category.includes('hoodie') || category.includes('sweat')) {
      return 'This is a hoodie/sweatshirt. Focus on hood style, pocket type, drawstring, fit, and fabric weight.';
    } else if (category.includes('jeans')) {
      return 'These are jeans. Focus on fit, wash type, length, pocket style, and denim details.';
    } else if (category.includes('kurti')) {
      return 'This is a kurti. Focus on neckline, sleeve style, embroidery, length, and ethnic design elements.';
    }
    
    return `This is a ${categoryConfig.displayName}. Analyze all visible design elements and construction details.`;
  }
}
