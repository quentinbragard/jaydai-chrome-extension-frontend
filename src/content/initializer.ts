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
  
  let isInitialized = false;
  
  /**
   * Initialize the extension within ChatGPT
   */
  async function initializeInternal() {
    if (isInitialized) {
      console.log('⚠️ Archimind already initialized, skipping');
      return true;
    }
  
    try {
      console.log('🔹 Archimind initializing...');
      
      // 1. First dynamically import the actual implementation modules
      // This allows us to keep this file small and focused
      const { getUserId } = await import('../utils/auth.js');
      const { componentInjector } = await import('../utils/componentInjector');
      const { messageObserver } = await import('../utils/messageObserver');
      
      // Load components dynamically to avoid bundling issues
      const { StatsPanel } = await import('../components/StatsPanel');
      const { MainButton } = await import('../components/MainButton');
      
      // 2. Authenticate user
      console.log('🔍 Checking user authentication...');
      const userId = await getUserId();
      
      if (!userId) {
        console.error('❌ User authentication failed - no user ID found');
        // Could inject a login prompt here instead
        return false;
      }
      
      console.log('👤 User authenticated:', userId);
      
      // 3. Setup message observer
      messageObserver.initialize();
      
      // 4. Setup live stats update when new messages arrive
      messageObserver.onNewMessage(() => {
        console.log('🔄 New message detected - stats may need updating');
      });
      
      // 5. Inject the components
      console.log('🔹 Injecting React components...');
      
      // Inject the StatsPanel in the top-right corner
      componentInjector.inject(StatsPanel, {}, {
        id: 'archimind-stats-panel',
        position: {
          type: 'fixed',
          top: '20px',
          right: '20px',
        }
      });
      
      // Inject the MainButton in the bottom-right corner
      componentInjector.inject(MainButton, {
        onSettingsClick: () => {
          console.log('Settings clicked');
          chrome.runtime.sendMessage({ action: 'openSettings' });
        },
        onSaveClick: () => {
          console.log('Save conversation clicked');
          chrome.runtime.sendMessage({ action: 'saveChatNow' });
        }
      }, {
        id: 'archimind-main-button',
      });
      
      isInitialized = true;
      console.log('✅ Archimind initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      return false;
    }
  }
  
  /**
   * Clean up injected components and observers
   */
  function cleanupInternal() {
    try {
      console.log('🔹 Cleaning up Archimind...');
      
      // Dynamically import modules to avoid bundling issues
      import('../utils/componentInjector').then(({ componentInjector }) => {
        componentInjector.removeAll();
      });
      
      import('../utils/messageObserver').then(({ messageObserver }) => {
        messageObserver.cleanup();
      });
      
      isInitialized = false;
      console.log('✅ Archimind cleanup complete');
      return true;
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      return false;
    }
  }