import type { SchemaItem } from '../../types/extraction/ExtractionTypes';

export class PromptService {
  generateGenericPrompt(schema: SchemaItem[]): string {
    const attributeDescriptions = schema.map(item => {
      const allowedValues = item.allowedValues?.length 
        ? ` (allowed values: ${item.allowedValues.join(', ')})` 
        : '';
      
      return `- ${item.key}: ${item.label}${allowedValues}`;
    }).join('\n');

    return `
You are an AI fashion attribute extraction specialist. Analyze this clothing image and extract the following attributes with high accuracy.

REQUIRED ATTRIBUTES:
${attributeDescriptions}

INSTRUCTIONS:
1. Examine the image carefully for each attribute
2. For select attributes, ONLY use values from the allowed list
3. For text/number attributes, provide precise descriptive values
4. If an attribute is not visible/applicable, use null
5. Provide confidence scores (0-100) for visual attributes

CRITICAL: Return ONLY valid JSON without markdown formatting or code blocks.

OUTPUT FORMAT (JSON ONLY):
{
  "attribute_key": {
    "rawValue": "extracted_value",
    "schemaValue": "normalized_value", 
    "visualConfidence": 85,
    "reasoning": "brief_explanation"
  }
}

Return pure JSON only. No markdown, no explanations, no code blocks.`.trim();
  }

  generateCategorySpecificPrompt(schema: SchemaItem[], categoryName: string): string {
    const basePrompt = this.generateGenericPrompt(schema);
    
    const categoryContext = this.getCategoryContext(categoryName);
    
    return `${basePrompt}

CATEGORY CONTEXT:
You are analyzing a ${categoryName}. ${categoryContext}

Pay special attention to attributes most relevant to this category type.

CRITICAL: Return pure JSON only, no markdown code blocks.`.trim();
  }

  private getCategoryContext(categoryName: string): string {
    const contexts: Record<string, string> = {
      'Kids Bermuda': 'Focus on casual wear attributes like fit, length, fabric type, and comfort features typical for children\'s shorts.',
      'Ladies Cig Pant': 'Emphasize formal wear characteristics, fit type, fabric composition, and professional styling details.',
      'Mens T Shirt': 'Prioritize casual wear elements like neck type, sleeve style, fabric composition, and print details.',
    };
    
    return contexts[categoryName] || 'Analyze all visible fashion attributes systematically.';
  }
}
