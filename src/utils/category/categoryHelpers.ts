import { CATEGORY_DEFINITIONS } from '../../constants/categories/categoryDefinitions';
import type { CategoryConfig, CategoryStats } from '../../types/category/CategoryTypes';

export class CategoryHelper {
  static getDepartments(): string[] {
    return [...new Set(CATEGORY_DEFINITIONS.map(c => c.department))];
  }

  static getSubDepartments(department: string): string[] {
    return [...new Set(
      CATEGORY_DEFINITIONS
        .filter(c => c.department === department && c.isActive)
        .map(c => c.subDepartment)
    )];
  }

  static getCategories(department: string, subDepartment: string): CategoryConfig[] {
    return CATEGORY_DEFINITIONS.filter(c =>
      c.department === department &&
      c.subDepartment === subDepartment &&
      c.isActive
    );
  }

  // ✅ ADD: Missing method that the hook needs
  static getAllCategories(): CategoryConfig[] {
    return CATEGORY_DEFINITIONS.filter(c => c.isActive);
  }

  static getCategoryConfig(categoryCode: string): CategoryConfig | undefined {
    return CATEGORY_DEFINITIONS.find(c => c.category === categoryCode && c.isActive);
  }

  static searchCategories(query: string): CategoryConfig[] {
    const lowercaseQuery = query.toLowerCase();
    return CATEGORY_DEFINITIONS.filter(c =>
      c.isActive && (
        c.displayName.toLowerCase().includes(lowercaseQuery) ||
        c.category.toLowerCase().includes(lowercaseQuery) ||
        c.department.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  static getCategoryStats(): CategoryStats {
    const activeCategories = CATEGORY_DEFINITIONS.filter(c => c.isActive);
    return {
      total: activeCategories.length,
      departments: this.getDepartments().length,
      kids: activeCategories.filter(c => c.department === 'KIDS').length,
      mens: activeCategories.filter(c => c.department === 'MENS').length,
      ladies: activeCategories.filter(c => c.department === 'LADIES').length,
      activeCategories: activeCategories.length
    };
  }

  static validateCategory(categoryConfig: CategoryConfig): string[] {
    const errors: string[] = [];
    if (!categoryConfig.department) errors.push('Department is required');
    if (!categoryConfig.subDepartment) errors.push('Sub-department is required');
    if (!categoryConfig.category) errors.push('Category code is required');
    if (!categoryConfig.displayName) errors.push('Display name is required');
    return errors;
  }
}
