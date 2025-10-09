/* eslint-disable @typescript-eslint/no-unused-vars */
import type { SchemaItem } from '../../types/extraction/ExtractionTypes';
import type { CategoryConfig } from '../../types/category/CategoryTypes';
import { MASTER_ATTRIBUTES } from '../../constants/categories/masterAttributes';
import { CategoryFocusedAttributeService } from '../../services/categoryFocusedAttributeService';

export class SchemaGenerator {
  // 🎯 NEW: Category-focused schema generation (surgical precision)
  static generateFocusedSchemaForCategory(
    categoryConfig: CategoryConfig, 
    optimizationLevel: 'minimal' | 'standard' | 'comprehensive' = 'standard'
  ): {
    schema: SchemaItem[];
    optimizationReport: {
      tokenSavings: number;
      accuracyBoost: number;
      processingSpeedIncrease: number;
      focusRatio: number;
    };
    filteredAttributes: string[];
    tokenEstimate: number;
  } {
    console.log(`🎯 Generating focused schema for ${categoryConfig.displayName}`);
    
    const focusedSchema = CategoryFocusedAttributeService.generateFocusedSchema(
      categoryConfig.department,
      categoryConfig.subDepartment,
      categoryConfig.category,
      optimizationLevel
    );

    const optimizationReport = CategoryFocusedAttributeService.generateOptimizationReport(focusedSchema);

    console.log(`✨ Focused schema: ${focusedSchema.relevantAttributes.length} attrs, ~${focusedSchema.tokenEstimate} tokens, ${optimizationReport.tokenSavings}% savings`);

    return {
      schema: focusedSchema.relevantAttributes,
      optimizationReport,
      filteredAttributes: focusedSchema.irrelevantAttributes,
      tokenEstimate: focusedSchema.tokenEstimate
    };
  }

  // ✅ LEGACY: Original schema generation (for backward compatibility)
  static generateSchemaForCategory(categoryConfig: CategoryConfig): SchemaItem[] {
    const activeAttributes = Object.entries(categoryConfig.attributes)
      .filter(([_, isActive]) => isActive)
      .map(([attributeKey]) => attributeKey);

    const schema: SchemaItem[] = [];

    for (const attributeKey of activeAttributes) {
      const masterAttribute = MASTER_ATTRIBUTES[attributeKey];
      if (masterAttribute) {
        const {
          key,
          label,
          fullForm,
          type,
          allowedValues = []
        } = masterAttribute;

        schema.push({
          key,
          label,
          fullForm,
          type,
          allowedValues,
          required: this.isAttributeRequired(attributeKey, categoryConfig),
        });
      } else {
        // Consider using a logger instead of console.warn
        console.warn(`Unknown attribute: ${attributeKey} for category ${categoryConfig.category}`);
      }
    }

    return schema.sort((a, b) => {
      // Sort required attributes first
      if (a.required && !b.required) return -1;
      if (!a.required && b.required) return 1;
      return a.label.localeCompare(b.label);
    });
  }

  private static isAttributeRequired(attributeKey: string, categoryConfig: CategoryConfig): boolean {
    // Define required attributes based on category type
    const alwaysRequired = ['add_acc1', 'micro_mvgr', 'color_main', 'size'];
    const fabricRequired = ['fab_division', 'fab_yarn_01'];

    if (alwaysRequired.includes(attributeKey)) return true;
    if (fabricRequired.includes(attributeKey)) return true;

    // Category-specific required attributes
    if (categoryConfig.category.includes('JEANS') && attributeKey === 'wash') return true;
    if (categoryConfig.category.includes('T_SHIRT') && attributeKey === 'neck') return true;

    return false;
  }

  static getSchemaStats(schema: SchemaItem[]): {
    total: number;
    required: number;
    optional: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    let required = 0;

    schema.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1;
      if (item.required) required++;
    });

    return {
      total: schema.length,
      required,
      optional: schema.length - required,
      byType
    };
  }
}
