// src/core/errors/AppError.ts

export enum ErrorCode {
    // Network errors
    NETWORK_ERROR = 'network_error',
    TIMEOUT_ERROR = 'timeout_error',
    
    // API errors
    API_ERROR = 'api_error',
    VALIDATION_ERROR = 'validation_error',
    NOT_FOUND_ERROR = 'not_found_error',
    
    // Auth errors
    AUTH_ERROR = 'auth_error',
    TOKEN_EXPIRED = 'token_expired',
    PERMISSION_DENIED = 'permission_denied',
    
    // Storage errors
    STORAGE_ERROR = 'storage_error',
    
    // Extension-specific errors
    EXTENSION_ERROR = 'extension_error',
    INJECTION_ERROR = 'injection_error',

    // Component errors
    COMPONENT_ERROR = 'component_error',
    
    // Misc
    UNKNOWN_ERROR = 'unknown_error'
  }
  
  export class AppError extends Error {
    readonly code: ErrorCode;
    readonly originalError?: any;
    readonly metadata?: Record<string, any>;
    
    constructor(message: string, code: ErrorCode = ErrorCode.UNKNOWN_ERROR, originalError?: any, metadata?: Record<string, any>) {
      super(message);
      
      this.name = 'AppError';
      this.code = code;
      this.originalError = originalError;
      this.metadata = metadata;
      
      // Ensure stack trace works
      Object.setPrototypeOf(this, AppError.prototype);
    }
    
    /**
     * Create error from an unknown error
     */
    static from(error: any, fallbackMessage = 'An unexpected error occurred'): AppError {
      // If already an AppError, just return it
      if (error instanceof AppError) {
        return error;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return new AppError(
          error.message || 'Network request failed',
          ErrorCode.NETWORK_ERROR,
          error
        );
      }
      
      // Handle API errors
      if (error?.status >= 400 || error?.response?.status >= 400) {
        return new AppError(
          error.message || 'API request failed',
          ErrorCode.API_ERROR,
          error,
          { status: error.status || error.response?.status }
        );
      }
      
      // Generic error handling
      return new AppError(
        error?.message || fallbackMessage,
        ErrorCode.UNKNOWN_ERROR,
        error
      );
    }
    
    /**
     * Convert to plain object for logging
     */
    toJSON(): Record<string, any> {
      return {
        name: this.name,
        message: this.message,
        code: this.code,
        stack: this.stack,
        metadata: this.metadata,
        originalError: this.originalError ? (
          this.originalError instanceof Error ? 
            { message: this.originalError.message, stack: this.originalError.stack } : 
            this.originalError
        ) : undefined
      };
    }
  }