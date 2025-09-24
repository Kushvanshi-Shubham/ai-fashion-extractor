import React from 'react'; // ✅ ADD: React import for JSX
import { message } from 'antd';
import { logger } from './logger';

export class AppError extends Error {
  public code?: string;
  public statusCode?: number;
  public isUserFacing: boolean;

  constructor(
    message: string,
    code?: string,
    statusCode?: number,
    isUserFacing = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isUserFacing = isUserFacing;
  }
}

export class APIError extends AppError {
  constructor(message: string, statusCode: number, code?: string) {
    super(message, code, statusCode, true);
    this.name = 'APIError';
  }
}

export class ValidationError extends AppError {
  public field?: string;

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400, true);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export const handleError = (error: Error, context?: string): void => {
  logger.error(`Error in ${context || 'application'}`, error);

  if (error instanceof AppError && error.isUserFacing) {
    message.error(error.message);
  } else if (error instanceof APIError) {
    const statusCode = error.statusCode ?? 500; // ✅ FIX: Handle undefined statusCode
    
    if (statusCode === 401) {
      message.error('Authentication failed. Please check your API key.');
    } else if (statusCode === 429) {
      message.error('Rate limit exceeded. Please wait and try again.');
    } else if (statusCode >= 500) {
      message.error('Server error. Please try again later.');
    } else {
      message.error(error.message);
    }
  } else {
    // Unknown errors
    message.error('An unexpected error occurred. Please try again.');
  }
};

// ✅ FIX: Simplified type-safe async wrapper (Vite compatible)
export function wrapAsyncFunction<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), context);
      throw error;
    }
  };
}

// ✅ FIX: Simplified sync wrapper
export function wrapSyncFunction<T extends unknown[], R>(
  fn: (...args: T) => R,
  context?: string
): (...args: T) => R {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), context);
      throw error;
    }
  };
}

// ✅ FIX: Simplified React component wrapper (Vite compatible)
export function withErrorBoundary<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const WrappedComponent = (props: P): React.ReactElement => {
    try {
      return React.createElement(Component, props);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)), Component.name);
      return React.createElement('div', {}, 'Something went wrong. Please try again.');
    }
  };
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// ✅ FIX: Type-safe API response handler
export function handleApiResponse<TData>(
  response: Response,
  data: unknown
): TData {
  if (!response.ok) {
    throw new APIError(
      `API request failed: ${response.statusText}`,
      response.status,
      `HTTP_${response.status}`
    );
  }

  if (!data) {
    throw new APIError('No data received from API', response.status);
  }

  return data as TData;
}

// ✅ FIX: Type-safe validation helper
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): T {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
  return value;
}

// ✅ FIX: Type-safe array validation
export function validateArray<T>(
  value: unknown,
  fieldName: string,
  itemValidator?: (item: unknown) => T
): T[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName);
  }

  if (itemValidator) {
    return value.map((item, index) => {
      try {
        return itemValidator(item);
      } catch (error) {
        throw new ValidationError(
          `${fieldName}[${index}]: ${error instanceof Error ? error.message : String(error)}`,
          `${fieldName}[${index}]`
        );
      }
    });
  }

  return value as T[];
}

// ✅ FIX: Type-safe object validation
export function validateObject<T extends Record<string, unknown>>(
  value: unknown,
  fieldName: string,
  schema: Record<string, (value: unknown) => unknown>
): T {
  if (typeof value !== 'object' || value === null) {
    throw new ValidationError(`${fieldName} must be an object`, fieldName);
  }

  const obj = value as Record<string, unknown>;
  const result = {} as T;

  for (const [key, validator] of Object.entries(schema)) {
    try {
      (result as Record<string, unknown>)[key] = validator(obj[key]);
    } catch (error) {
      throw new ValidationError(
        `${fieldName}.${key}: ${error instanceof Error ? error.message : String(error)}`,
        `${fieldName}.${key}`
      );
    }
  }

  return result;
}

// ✅ FIX: Type-safe retry mechanism
export function withRetry<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  maxRetries = 3,
  delay = 1000
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          logger.error(`Function failed after ${maxRetries} attempts`, lastError);
          throw lastError;
        }
        
        logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, lastError);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
    
    throw lastError;
  };
}

// ✅ FIX: Type-safe timeout wrapper
export function withTimeout<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  timeoutMs = 5000
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new AppError(`Operation timed out after ${timeoutMs}ms`, 'TIMEOUT', 408));
      }, timeoutMs);
    });

    return Promise.race([fn(...args), timeoutPromise]);
  };
}

// ✅ FIX: Simple type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
