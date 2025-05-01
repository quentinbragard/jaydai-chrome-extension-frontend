// src/extension/content/injectedInterceptor/index.js
// Main entry point for the injected interceptor - Updated for TS

// Import the initializer from the TypeScript file
// Vite should handle the .ts extension during build
import { initFetchInterceptor } from './fetchInterceptor';
// eventsHandler might still be needed or its functionality moved
import { sendInjectionComplete } from './eventsHandler';

/**
 * Self-executing function to initialize the interceptor
 */
(function() {
  try {
    // Initialize the fetch interceptor (now from the TS file)
    initFetchInterceptor();

    // Notify that injection is complete - This might be handled within initFetchInterceptor now
    // sendInjectionComplete(); // Check if still needed here

    console.log('✅ Jaydai network interceptor bridge initialized.');
  } catch (error) {
    console.error('❌ Error initializing network interceptor bridge:', error);
  }
})();

