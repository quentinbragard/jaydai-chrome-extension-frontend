import { debug } from '@/core/config';
// Only use in development mode
export function setupDevReload() {
    if (process.env.NODE_ENV !== 'development') return;
    
    debug('🧪 Development auto-reload activated');
    
    // Check for changes every 1 second
    setInterval(() => {
      // We'll trigger a reload by touching a specific timestamp
      chrome.storage.local.set({ 'devReloadTimestamp': Date.now() });
    }, 1000);
  }