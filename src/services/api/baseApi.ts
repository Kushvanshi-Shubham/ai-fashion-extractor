import type { ApiResponse } from '../../types/core/CommonTypes';

export class BaseApiService {
  protected baseURL: string;
  protected apiKey: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://api.openai.com/v1';
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

    // ✅ IMPROVED: Better error handling for missing API key
    if (!this.apiKey) {
      console.warn('⚠️  API key not found. Please add VITE_OPENAI_API_KEY to your .env file');
      console.warn('📝 Create a .env file with: VITE_OPENAI_API_KEY=your-key-here');
      // Don't throw error immediately - let components handle it gracefully
    }
  }

  // ✅ NEW: Check if API is configured
  public isConfigured(): boolean {
    return !!this.apiKey;
  }

  // ✅ FIXED: Proper generic type for ApiResponse
  protected async makeRequest<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // ✅ IMPROVED: Check API key before making request
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.',
        timestamp: Date.now()
      };
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
      }

      const data = await response.json() as T;
      return {
        success: true,
        data,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  // ✅ FIXED: Replace 'any' with proper generic types
  protected async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
    throw new Error('Max retries exceeded');
  }

  // ✅ BONUS: Additional helper methods
  protected buildUrl(endpoint: string, params?: Record<string, string | number>): string {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    return url.toString();
  }

  protected handleApiError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}

// ✅ BONUS: Export configuration checker
export const checkApiConfiguration = (): { 
  configured: boolean; 
  message: string;
  suggestions: string[];
} => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    return {
      configured: false,
      message: 'OpenAI API key is missing',
      suggestions: [
        'Create a .env file in your project root',
        'Add: VITE_OPENAI_API_KEY=sk-your-key-here',
        'Restart your development server',
        'Get your key from https://platform.openai.com'
      ]
    };
  }

  if (!apiKey.startsWith('sk-')) {
    return {
      configured: false,
      message: 'Invalid API key format',
      suggestions: [
        'API key should start with "sk-"',
        'Check your .env file for typos',
        'Generate a new key from OpenAI platform'
      ]
    };
  }

  return {
    configured: true,
    message: 'API configuration looks good!',
    suggestions: []
  };
};

// ✅ BONUS: Export types for better type inference
export interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export interface ApiError {
  message: string;
  code?: string | number;
  timestamp: number;
}
