import type { Department, AttributeType, BaseEntity } from '../core/CommonTypes';

export interface AttributeDefinition {
  key: string;
  label: string;
  type: AttributeType;
  allowedValues?: string[];
  required?: boolean;
  description?: string;
}

export interface AttributeFlags {
  [key: string]: boolean;
}

export interface CategoryConfig extends BaseEntity {
  department: Department;
  subDepartment: string;
  category: string;
  displayName: string;
  description?: string;
  attributes: AttributeFlags;
  isActive: boolean;
}

export interface CategoryHierarchy {
  [department: string]: {
    [subDepartment: string]: string[];
  };
}

export interface CategoryStats {
  total: number;
  departments: number;
  kids: number;
  mens: number;
  ladies: number;
  activeCategories: number;
}
