import { errorReporter } from './core/errors/ErrorReporter';
import { AppError } from './core/errors/AppError';
import { config, debug } from './core/config';
import { contentScript } from './extension/content/ContentScript';

/**
 * Initialize the extension
 */
async function initializeExtension(): Promise<void> {
  try {
    debug(`Initializing Archimind Extension v${config.version}...`);
    
    // Check if we're in a content script context
    if (typeof document !== 'undefined') {
      // Initialize content script
      const success = await contentScript.initialize();
      
      if (success) {
        debug('Extension initialized successfully');
      } else {
        debug('Extension initialization skipped or failed');
      }
    }
  } catch (error) {
    const appError = AppError.from(error, 'Failed to initialize extension');
    errorReporter.captureError(appError);
  }
}

// Automatically initialize if we're in a browser context
if (typeof window !== 'undefined') {
  // Wait for document to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
  } else {
    initializeExtension();
  }
  
  // Set up cleanup on unload
  window.addEventListener('beforeunload', () => {
    contentScript.cleanup();
  });
}

export default {
  initialize: initializeExtension
};