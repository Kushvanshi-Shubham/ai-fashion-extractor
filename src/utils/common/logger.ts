// ✅ FIX: Use const assertions instead of enum for Vite compatibility
export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
} as const;

export type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

// ✅ FIX: Define proper types for logging data
type LoggableData = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined
  | Error
  | Record<string, unknown>
  | Array<unknown>;

class AppLogger {  // ✅ FIX: Renamed to avoid conflicts
  private isDevelopment = import.meta.env.DEV;
  private enableLogging = import.meta.env.VITE_ENABLE_LOGGING !== 'false';

  // ✅ FIX: Replace any with proper type
  private formatMessage(level: LogLevelType, message: string, data?: LoggableData): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (!data) {
      return `${prefix} ${message}`;
    }

    // Handle different data types safely
    let formattedData: string;
    
    if (data instanceof Error) {
      formattedData = JSON.stringify({
        name: data.name,
        message: data.message,
        stack: data.stack
      }, null, 2);
    } else if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      formattedData = String(data);
    } else {
      try {
        formattedData = JSON.stringify(data, null, 2);
      } catch {
        formattedData = '[Unserializable Object]';
      }
    }
    
    return `${prefix} ${message} ${formattedData}`;
  }

  // ✅ FIX: Replace any with proper union type
  error(message: string, error?: Error | LoggableData): void {
    if (!this.enableLogging && !this.isDevelopment) return;
    
    const formattedMessage = this.formatMessage(LogLevel.ERROR, message, error);
    console.error(formattedMessage);
  }

  // ✅ FIX: Replace any with LoggableData
  warn(message: string, data?: LoggableData): void {
    if (!this.enableLogging && !this.isDevelopment) return;
    
    const formattedMessage = this.formatMessage(LogLevel.WARN, message, data);
    console.warn(formattedMessage);
  }

  // ✅ FIX: Replace any with LoggableData
  info(message: string, data?: LoggableData): void {
    if (!this.enableLogging && !this.isDevelopment) return;
    
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, data);
    console.info(formattedMessage);
  }

  // ✅ FIX: Replace any with LoggableData
  debug(message: string, data?: LoggableData): void {
    if (!this.isDevelopment) return;
    
    const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, data);
    console.debug(formattedMessage);
  }

  // ✅ FIX: Replace any with LoggableData
  performance(operation: string, duration: number, additionalData?: LoggableData): void {
    if (!this.isDevelopment) return;
    
    const message = `Performance: ${operation} took ${duration.toFixed(2)}ms`;
    this.debug(message, additionalData);
  }

  // ✅ Additional type-safe logging methods
  table(data: Record<string, unknown>[] | Record<string, unknown>): void {
    if (!this.isDevelopment) return;
    console.table(data);
  }

  group(label: string): void {
    if (!this.isDevelopment) return;
    console.group(label);
  }

  groupEnd(): void {
    if (!this.isDevelopment) return;
    console.groupEnd();
  }

  time(label: string): void {
    if (!this.isDevelopment) return;
    console.time(label);
  }

  timeEnd(label: string): void {
    if (!this.isDevelopment) return;
    console.timeEnd(label);
  }

  // ✅ Type-safe conditional logging
  logIf(condition: boolean, level: LogLevelType, message: string, data?: LoggableData): void {
    if (!condition) return;
    
    switch (level) {
      case LogLevel.ERROR:
        this.error(message, data);
        break;
      case LogLevel.WARN:
        this.warn(message, data);
        break;
      case LogLevel.INFO:
        this.info(message, data);
        break;
      case LogLevel.DEBUG:
        this.debug(message, data);
        break;
      default:
        this.info(message, data);
    }
  }

  // ✅ Type-safe API request logging
  logApiRequest(method: string, url: string, data?: LoggableData): void {
    this.debug(`API ${method.toUpperCase()} ${url}`, data);
  }

  logApiResponse(method: string, url: string, status: number, data?: LoggableData): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.DEBUG;
    this.logIf(true, level, `API ${method.toUpperCase()} ${url} - ${status}`, data);
  }

  // ✅ Type-safe error boundary logging
  logError(error: Error, context?: string, additionalData?: Record<string, unknown>): void {
    const errorData = {
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...additionalData
    };
    
    this.error(`Error in ${context || 'application'}`, errorData);
  }

  // ✅ Type-safe performance measurement
  measurePerformance<T>(
    operation: string, 
    fn: () => T,
    additionalData?: LoggableData
  ): T {
    const start = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.performance(operation, duration, additionalData);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${operation} failed after ${duration.toFixed(2)}ms`, error as LoggableData);
      throw error;
    }
  }

  // ✅ Type-safe async performance measurement
  async measurePerformanceAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    additionalData?: LoggableData
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.performance(operation, duration, additionalData);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${operation} failed after ${duration.toFixed(2)}ms`, error as LoggableData);
      throw error;
    }
  }
}

export const logger = new AppLogger();

// ✅ Type-safe logger utilities
export const createLogger = (namespace: string) => ({
  error: (message: string, data?: LoggableData) => 
    logger.error(`[${namespace}] ${message}`, data),
  warn: (message: string, data?: LoggableData) => 
    logger.warn(`[${namespace}] ${message}`, data),
  info: (message: string, data?: LoggableData) => 
    logger.info(`[${namespace}] ${message}`, data),
  debug: (message: string, data?: LoggableData) => 
    logger.debug(`[${namespace}] ${message}`, data),
});

// ✅ Export types for use in other files
export type AppLoggerType = typeof logger;  // ✅ FIX: Renamed type
export type NamespacedLogger = ReturnType<typeof createLogger>;

// ✅ Export LoggableData type for external use
export type { LoggableData };
