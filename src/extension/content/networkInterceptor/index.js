// src/extension/content/networkInterceptor/index.js
// Main entry point for the injected interceptor

import { initFetchInterceptor } from './fetchInterceptor';

/**
 * Self-executing function to initialize the interceptor
 */
(function() {
  try {
    // Initialize the fetch interceptor
    initFetchInterceptor();
    
  } catch (error) {
    console.error('❌ Error initializing network interceptor:', error);
  }
})();