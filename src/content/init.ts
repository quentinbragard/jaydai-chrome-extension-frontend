import { getUserId } from '@/utils/auth.js';
import { componentInjector } from '@/utils/componentInjector';
import { messageObserver } from '@/utils/messageObserver';
import { StatsPanel } from '@/components/StatsPanel';
import { MainButton } from '@/components/MainButton';

let isInitialized = false;

/**
 * Initialize the extension within ChatGPT
 */
export async function initialize() {
  if (isInitialized) {
    console.log('⚠️ Archimind already initialized, skipping');
    return true;
  }

  try {
    console.log('🔍 Checking user authentication...');
    const userId = await getUserId();
    
    if (!userId) {
      console.error('❌ User authentication failed - no user ID found');
      // Here you could inject a login prompt instead
      return false;
    }
    
    console.log('👤 User authenticated:', userId);
    
    // Start observing ChatGPT messages
    messageObserver.initialize();
    
    // Setup live stats update when new messages arrive
    messageObserver.onNewMessage(() => {
      // You could emit events or update components directly 
      // This is a simple approach that would work
      console.log('🔄 New message detected - stats may need updating');
    });
    
    // Inject the components
    injectComponents();
    
    isInitialized = true;
    console.log('✅ Archimind initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    return false;
  }
};

/**
 * Inject React components into the DOM
 */
function injectComponents() {
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
      // Open settings dialog or navigate to options page
      chrome.runtime.sendMessage({ action: 'openSettings' });
    },
    onSaveClick: () => {
      console.log('Save conversation clicked');
      // Trigger immediate save of the current conversation
      chrome.runtime.sendMessage({ action: 'saveChatNow' });
    }
  }, {
    id: 'archimind-main-button',
    // The MainButton component already has fixed positioning
  });
}

/**
 * Clean up injected components and observers
 */
export function cleanup() {
  componentInjector.removeAll();
  messageObserver.cleanup();
  isInitialized = false;
  console.log('✅ Archimind cleanup complete');
};
