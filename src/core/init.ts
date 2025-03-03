import { getUserId } from '@/utils/auth.js';
import { injectStatsPanel } from '@/entry_points/injectStatsPanel';

let isInitialized = false;

/**
 * Initialize the extension
 * @returns {Promise<boolean>} Whether initialization was successful
 */
export const initialize = async () => {
  if (isInitialized) {
    console.log('⚠️ Archimind already initialized, skipping');
    return true;
  }

  try {
    console.log('🔍 Checking user authentication...');
    const userId = await getUserId();
    console.log('👤 User authenticated:', userId);
    
    if (!userId) {
      console.error('❌ User authentication failed - no user ID found');
      return false;
    }
    
    console.log('👤 User authenticated:', userId);
    
    // Initialize UI components
    injectStatsPanel();
    
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    return false;
  }
};

// Export other functions as needed
export const cleanup = () => {
  // Cleanup logic
};

// ✅ Force module execution (for debugging)
console.log("✅ core/init.ts module loaded");
