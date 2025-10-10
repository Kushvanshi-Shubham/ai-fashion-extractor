// 🎯 Category-Focused Attribute System - Surgical precision for AI prompts

import { CATEGORY_DEFINITIONS } from '../constants/categories/categoryDefinitions';
import { MASTER_ATTRIBUTES } from '../constants/categories/masterAttributes';
// CategoryConfig imported where needed in methods
import type { SchemaItem } from '../types/extraction/ExtractionTypes';

export interface CategoryFocusedSchema {
  categoryInfo: {
    department: string;
    subDepartment: string;
    category: string;
    displayName: string;
  };
  relevantAttributes: SchemaItem[];
  irrelevantAttributes: string[]; // Attributes filtered out
  tokenEstimate: number;
  optimizationLevel: 'minimal' | 'standard' | 'comprehensive';
}

export class CategoryFocusedAttributeService {
  
  // 🎯 CORE METHOD: Generate category-specific schema (surgical precision)
  static generateFocusedSchema(
    department: string,
    subDepartment: string, 
    category: string,
    optimizationLevel: 'minimal' | 'standard' | 'comprehensive' = 'standard'
  ): CategoryFocusedSchema {
    
    console.log(`🎯 Generating focused schema for: ${department} → ${subDepartment} → ${category}`);
    
    // Find category configuration
    const categoryConfig = CATEGORY_DEFINITIONS.find(
      c => c.department === department && 
           c.subDepartment === subDepartment && 
           c.category === category
    );

    if (!categoryConfig) {
      throw new Error(`Category not found: ${department}_${subDepartment}_${category}`);
    }

    // Get all possible attributes
    const allAttributes = Object.keys(MASTER_ATTRIBUTES);
    
    // Filter attributes based on category configuration
    const relevantAttributeKeys = allAttributes.filter(key => 
      categoryConfig.attributes[key] === true
    );

    // Apply optimization-based filtering
    const filteredAttributes = this.applyOptimizationFiltering(
      relevantAttributeKeys,
      department,
      subDepartment, 
      category,
      optimizationLevel
    );

    // Generate schema items
    const relevantAttributes: SchemaItem[] = filteredAttributes.map(key => ({
      key,
      label: MASTER_ATTRIBUTES[key].label,
      type: MASTER_ATTRIBUTES[key].type,
      allowedValues: MASTER_ATTRIBUTES[key].allowedValues,
      description: MASTER_ATTRIBUTES[key].description,
      isRequired: this.isAttributeRequired(key, department, subDepartment, category)
    }));

    // Calculate irrelevant attributes (for reporting)
    const irrelevantAttributes = allAttributes.filter(key => 
      !filteredAttributes.includes(key)
    );

    // Estimate tokens
    const tokenEstimate = this.estimateTokenUsage(relevantAttributes);

    console.log(`✨ Focused schema generated: ${relevantAttributes.length} relevant, ${irrelevantAttributes.length} filtered out, ~${tokenEstimate} tokens`);

    return {
      categoryInfo: {
        department: categoryConfig.department,
        subDepartment: categoryConfig.subDepartment,
        category: categoryConfig.category,
        displayName: categoryConfig.displayName
      },
      relevantAttributes,
      irrelevantAttributes,
      tokenEstimate,
      optimizationLevel
    };
  }

  // 🔍 Apply category-specific intelligent filtering
  private static applyOptimizationFiltering(
    baseAttributes: string[],
    department: string,
    subDepartment: string,
    category: string,
    optimizationLevel: 'minimal' | 'standard' | 'comprehensive'
  ): string[] {

    // Define category-specific priority attributes
    const categoryPriorities = this.getCategoryPriorities(department, subDepartment, category);
    
    switch (optimizationLevel) {
      case 'minimal':
        // Only essential attributes (top 5-8)
        return baseAttributes
          .filter(attr => categoryPriorities.essential.includes(attr))
          .slice(0, 8);
          
      case 'standard':
        // Essential + important attributes (8-15)
        return baseAttributes.filter(attr => 
          categoryPriorities.essential.includes(attr) ||
          categoryPriorities.important.includes(attr)
        ).slice(0, 15);
        
      case 'comprehensive':
        // All relevant attributes with smart ordering
        return [
          ...categoryPriorities.essential,
          ...categoryPriorities.important,
          ...baseAttributes.filter(attr => 
            !categoryPriorities.essential.includes(attr) &&
            !categoryPriorities.important.includes(attr)
          )
        ].slice(0, 20);
        
      default:
        return baseAttributes;
    }
  }

  // 🎯 Category-specific attribute priorities (the secret sauce!)
  private static getCategoryPriorities(
    department: string,
    subDepartment: string,
    category: string
  ): { essential: string[], important: string[] } {

    const key = `${department}_${subDepartment}_${category}`.toLowerCase();
    
    const priorities: Record<string, { essential: string[], important: string[] }> = {
      
      // 👕 MENS T-SHIRTS - Focus on fit, style, fabric
      'mens_tops_tshirt': {
        essential: ['neck', 'neck_type', 'sleeves_main_style', 'fit', 'fab_composition', 'pattern'],
        important: ['fab_gsm', 'fab_finish', 'collar_type', 'length', 'width_inch']
      },
      
      // 👖 MENS BOTTOMS - Focus on fit, waist, length
      'mens_bottoms_jeans': {
        essential: ['fit', 'length', 'father_belt', 'belt_design', 'pocket_type', 'front_open_style'],
        important: ['fab_composition', 'fab_finish', 'pattern', 'bottom_fold', 'drawcord']
      },

      // 👗 LADIES TOPS - Focus on style, fit, details
      'ladies_tops_blouse': {
        essential: ['neck', 'neck_type', 'sleeves_main_style', 'fit', 'placket', 'fab_composition'],
        important: ['pattern', 'length', 'collar_type', 'button', 'front_open_style']
      },

      // 🩳 KIDS BERMUDA - Focus on comfort, safety, adjustability  
      'kids_ib_ib_bermuda': {
        essential: ['fit', 'length', 'father_belt', 'belt_design', 'pocket_type', 'drawcord'],
        important: ['fab_composition', 'bottom_fold', 'pattern', 'fab_lycra', 'additional_accessories']
      }
    };

    return priorities[key] || {
      essential: ['fit', 'fab_composition', 'pattern', 'length'],
      important: ['neck', 'sleeves_main_style', 'pocket_type', 'belt_design']
    };
  }

  // 📏 Smart token estimation based on focused attributes
  private static estimateTokenUsage(attributes: SchemaItem[]): number {
    const basePromptTokens = 800; // Base instruction tokens
    const categoryContextTokens = 200; // Category-specific context
    
    const attributeTokens = attributes.reduce((total, attr) => {
      const labelTokens = attr.label.length / 4; // ~4 chars per token
      const allowedValuesTokens = attr.allowedValues 
        ? attr.allowedValues.length * 8 // ~8 tokens per allowed value
        : 20; // Default for open text fields
      
      return total + labelTokens + allowedValuesTokens;
    }, 0);

    return Math.round(basePromptTokens + categoryContextTokens + attributeTokens);
  }

  // ⭐ Determine if attribute is required for this category
  private static isAttributeRequired(
    attributeKey: string,
    department: string,
    subDepartment: string,
    category: string
  ): boolean {
    const essentialAttributes = this.getCategoryPriorities(department, subDepartment, category).essential;
    return essentialAttributes.includes(attributeKey);
  }

  // 📊 Generate optimization report
  static generateOptimizationReport(schema: CategoryFocusedSchema): {
    tokenSavings: number;
    accuracyBoost: number;
    processingSpeedIncrease: number;
    focusRatio: number;
  } {
    const totalPossibleAttributes = Object.keys(MASTER_ATTRIBUTES).length;
    const focusRatio = schema.relevantAttributes.length / totalPossibleAttributes;
    
    // Estimate improvements based on filtering
    const tokenSavings = Math.round((1 - focusRatio) * 70); // Up to 70% savings
    const accuracyBoost = Math.round(focusRatio < 0.3 ? 25 : focusRatio < 0.6 ? 15 : 10);
    const processingSpeedIncrease = Math.round((1 - focusRatio) * 60); // Up to 60% faster
    
    return {
      tokenSavings,
      accuracyBoost,
      processingSpeedIncrease,
      focusRatio: Math.round(focusRatio * 100)
    };
  }

  // 🔍 Preview what gets filtered out (for debugging)
  static previewFiltering(
    department: string,
    subDepartment: string,
    category: string
  ): {
    included: string[];
    excluded: string[];
    reasons: Record<string, string>;
  } {
    const schema = this.generateFocusedSchema(department, subDepartment, category);
    
    const included = schema.relevantAttributes.map(attr => attr.key);
    const excluded = schema.irrelevantAttributes;
    
    const reasons: Record<string, string> = {};
    excluded.forEach(attr => {
      if (attr.includes('belt') && !category.toLowerCase().includes('pant')) {
        reasons[attr] = 'Not relevant for non-pant items';
      } else if (attr.includes('sleeve') && category.toLowerCase().includes('bottom')) {
        reasons[attr] = 'Sleeves not relevant for bottoms';
      } else if (attr.includes('collar') && category.toLowerCase().includes('short')) {
        reasons[attr] = 'Collar details not relevant for shorts';
      } else {
        reasons[attr] = 'Not configured for this category';
      }
    });

    return { included, excluded, reasons };
  }
}