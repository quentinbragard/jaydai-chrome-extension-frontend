// src/content/initializer.ts
/**
 * Content script initializer - standalone file with minimal imports
 * This file is specifically designed to be the entry point for content-init.js
 */

// Explicitly forward declare what we're exporting to avoid any confusion
export function initialize() {
  return initializeInternal();
}

export function cleanup() {
  return cleanupInternal();
}

// Default export as a fallback for different import methods
export default {
  initialize,
  cleanup
};

/**
 * Initialize the extension within ChatGPT
 */
async function initializeInternal() {
  try {
    console.log('🔹 Archimind initializing...');
    
    // Dynamically import the app initializer to avoid bundling issues
     // Use chrome.runtime.getURL to get the correct path to applicationInitializer
     const applicationInitializerUrl = chrome.runtime.getURL('applicationInitializer.js');
     console.log('🔹 Application initializer URL:', applicationInitializerUrl);
    
     // Dynamically import the app initializer using the correct URL
     const { appInitializer } = await import(applicationInitializerUrl);

    console.log('🔹 App initializer imported:', appInitializer);  
    
    // Initialize the application
    const success = await appInitializer.initialize();
    
    if (success) {
      console.log('✅ Archimind initialized successfully');
    } else {
      console.error('❌ Archimind initialization failed');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error initializing Archimind:', error);
    return false;
  }
}

/**
 * Clean up injected components and observers
 */
async function cleanupInternal() {
  try {
    console.log('🔹 Cleaning up Archimind...');
    
    // Dynamically import the app initializer
    const { appInitializer } = await import('./applicationInitializer');
    
    // Clean up the application
    appInitializer.cleanup();
    
    console.log('✅ Archimind cleanup complete');
    return true;
  } catch (error) {
    console.error('❌ Error cleaning up Archimind:', error);
    return false;
  }
}