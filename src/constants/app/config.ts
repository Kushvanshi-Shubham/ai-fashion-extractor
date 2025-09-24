export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'AI Fashion Attribute Extractor',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // File upload limits
  maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  maxConcurrentExtractions: parseInt(import.meta.env.VITE_MAX_CONCURRENT_EXTRACTIONS) || 3,
  
  // Supported file types
  supportedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  
  // AI Configuration
  openAI: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.openai.com/v1',
    model: 'gpt-4o',
    maxTokens: 2048,
    temperature: 0.1
  },
  
  // Development settings
  isDevelopment: import.meta.env.DEV,
  enableLogging: import.meta.env.VITE_ENABLE_LOGGING !== 'false',
  
  // Database settings
  indexedDB: {
    name: 'ClothingExtractor',
    version: 1
  }
};

export const validateConfig = (): string[] => {
  const errors: string[] = [];
  
  if (!APP_CONFIG.openAI.apiKey) {
    errors.push('VITE_OPENAI_API_KEY is required');
  }
  
  if (APP_CONFIG.maxFileSize < 1024 * 1024) {
    errors.push('VITE_MAX_FILE_SIZE should be at least 1MB');
  }
  
  return errors;
};
