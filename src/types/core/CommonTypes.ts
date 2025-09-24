// Base types used across the application
export type Department = 'KIDS' | 'MENS' | 'LADIES';
export type AttributeType = 'select' | 'text' | 'number' | 'boolean';
export type ExtractionStatus = 'Pending' | 'Extracting' | 'Done' | 'Error';
export type ModelType = 'gpt-4o' | 'gpt-4o-mini';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
