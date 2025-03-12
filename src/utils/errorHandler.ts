// src/utils/errorHandler.ts

/**
 * Error types
 */
export enum ErrorType {
    NETWORK = 'network',
    API = 'api',
    AUTH = 'auth',
    VALIDATION = 'validation',
    UNKNOWN = 'unknown'
  }
  
  /**
   * Structured error object
   */
  export interface AppError {
    type: ErrorType;
    message: string;
    originalError?: any;
    code?: string;
    data?: any;
  }
  
  /**
   * Error handler
   */
  export class ErrorHandler {
    /**
     * Handle error and convert to AppError
     */
    static handleError(error: any, context?: string): AppError {
      // Network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          type: ErrorType.NETWORK,
          message: 'Network error. Please check your connection.',
          originalError: error
        };
      }
      
      // API errors (assuming they follow a certain structure)
      if (error?.status >= 400 || error?.response?.status >= 400) {
        return {
          type: ErrorType.API,
          message: error.message || 'API error',
          code: String(error.status || error.response?.status),
          originalError: error
        };
      }
      
      // Auth errors
      if (error?.message?.includes('auth') || error?.message?.includes('token')) {
        return {
          type: ErrorType.AUTH,
          message: 'Authentication error. Please sign in again.',
          originalError: error
        };
      }
      
      // Default unknown error
      return {
        type: ErrorType.UNKNOWN,
        message: error?.message || 'An unknown error occurred',
        originalError: error,
        data: { context }
      };
    }
    
    /**
     * Log error with consistent format
     */
    static logError(error: AppError, source?: string): void {
      const logPrefix = source ? `[${source}]` : '[App]';
      console.error(`${logPrefix} Error (${error.type}): ${error.message}`, error);
    }
  }