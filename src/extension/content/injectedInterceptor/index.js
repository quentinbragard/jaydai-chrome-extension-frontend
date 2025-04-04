// src/extension/content/injectedInterceptor.js
// Bridge file that maintains the original path while using our modular code

// Import from the modular structure
import { initFetchInterceptor } from './fetchInterceptor';
import { sendInjectionComplete } from './interceptedEventsHanlder';

/**
 * Self-executing function to initialize the interceptor
 * This maintains the exact same initialization as before
 */
(function() {
  try {
    // Initialize the fetch interceptor
    initFetchInterceptor();
    
    // Notify that injection is complete
    sendInjectionComplete();
    
    console.log('✅ Archimind network interceptor initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing network interceptor:', error);
  }
})();

// We don't need to export anything from this file since it's self-executing