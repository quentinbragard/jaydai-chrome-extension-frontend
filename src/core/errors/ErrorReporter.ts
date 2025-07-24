
// src/core/errors/ErrorReporter.ts

import { AppError, ErrorCode } from './AppError';
import { config } from '../config';
import { onEvent, AppEvent } from '../events/events';
import { trackEvent, EVENTS } from '@/utils/amplitude';

/**
 * Error reporter to track and report errors
 */
export class ErrorReporter {
  private static instance: ErrorReporter;
  private recentErrors: Array<{ error: AppError; timestamp: number }> = [];
  private maxRecentErrors = 20;
  
  private constructor() {
    this.initializeEventListeners();
  }
  
  public static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }
  
  /**
   * Initialize event listeners for error tracking
   */
  private initializeEventListeners(): void {
    // Listen for extension errors
    onEvent(AppEvent.EXTENSION_ERROR, ({ message, stack }) => {
      this.captureError(new AppError(message, ErrorCode.EXTENSION_ERROR, { stack }));
    });
    
    // Listen for unhandled errors and promises
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        if (event.message?.includes('ResizeObserver loop completed')) {
          return;
        }
        this.captureError(
          new AppError(
            event.message || 'Unhandled error',
            ErrorCode.UNHANDLED_ERROR,
            { fileName: event.filename, lineNo: event.lineno, colNo: event.colno }
          )
        );
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        const message = event.reason?.message || '';
        if (message.includes('ResizeObserver loop completed')) {
          return;
        }
        this.captureError(
          new AppError(
            message || 'Unhandled promise rejection',
            ErrorCode.UNHANDLED_REJECTION,
            event.reason
          )
        );
      });
    }
  }
  
  /**
   * Capture and report an error
   */
  public captureError(error: Error | AppError | string, metadata?: Record<string, any>): void {
    // Convert to AppError if needed
    const appError = error instanceof AppError ? 
      error : 
      (typeof error === 'string' ? 
        new AppError(error, ErrorCode.UNKNOWN_ERROR, undefined, metadata) : 
        AppError.from(error)
      );
    
    // Log the error
    console.error('[ErrorReporter]', appError);
    if (appError.message !== "API request to /stats/user failed" && appError.message !== "Error loading stats") {
    trackEvent(EVENTS.ERROR_OCCURRED, {
        code: appError.code,
        message: appError.message
      });
    }
    
    // Store in recent errors
    this.recentErrors.push({
      error: appError,
      timestamp: Date.now()
    });
    
    // Trim to max size
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors.shift();
    }
    
    // In development, don't send to server
    if (!config.debug) {
      this.sendErrorToServer(appError);
    }
  }
  
  /**
   * Send error to server for logging
   */
  private sendErrorToServer(error: AppError): void {
    // This would be implemented to send to your error tracking service
    // For now, we'll just simulate it
    setTimeout(() => {
      console.log('[ErrorReporter] Error sent to server:', error.toJSON());
    }, 0);
  }
  
  /**
   * Get recent errors
   */
  public getRecentErrors(): Array<{ error: AppError; timestamp: number }> {
    return [...this.recentErrors];
  }
  
  /**
   * Clear recent errors
   */
  public clearRecentErrors(): void {
    this.recentErrors = [];
  }
}

export const errorReporter = ErrorReporter.getInstance();