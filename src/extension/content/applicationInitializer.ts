// Import necessary components and services
import { serviceManager } from '@/core/managers/ServiceManager';
import { eventManager } from '@/core/events/EventManager';
import { registerServices } from '@/services';
import { componentInjector } from '@/core/utils/componentInjector';
import MainButton from '@/components/MainButton';
import { dialogManager } from '@/core/managers/DialogManager';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';

/**
 * Main application initializer
 * Coordinates the initialization of all services and components
 */
export class AppInitializer {
  private static instance: AppInitializer;
  private isInitialized: boolean = false;
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }
  
  /**
   * Initialize the application
   */
  public async initialize(): Promise<boolean> {
    // Skip if already initialized
    if (this.isInitialized) {
      return true;
    }
    
    // Skip if we're not on ChatGPT
    if (!this.isChatGPTSite()) {
      return false;
    }
    
    try {
      console.log('🚀 Initializing Archimind application...');
      
      // Register services
      registerServices();
      
      // Initialize event manager
      eventManager.initialize();
      
      // Initialize services (in correct order)
      await serviceManager.initializeAll();
      
      // Inject UI components
      this.injectUIComponents();
      
      this.isInitialized = true;
      console.log('✅ Archimind application initialized successfully');
      return true;
    } catch (error) {
      errorReporter.captureError(
        new AppError('Failed to initialize application', ErrorCode.EXTENSION_ERROR, error)
      );
      console.error('❌ Error initializing application:', error);
      return false;
    }
  }
  
  /**
   * Check if we're on ChatGPT
   */
  private isChatGPTSite(): boolean {
    return window.location.hostname.includes('chatgpt.com') || 
           window.location.hostname.includes('chat.openai.com');
  }
  
  /**
   * Inject UI components
   */
  private injectUIComponents(): void {
    console.log('🔧 Injecting UI components...');
    
    // Inject the Main Button
    componentInjector.inject(MainButton, {
      onSettingsClick: () => this.openSettings(),
      onSaveClick: () => this.saveCurrentConversation()
    }, {
      id: 'archimind-main-button',
      position: {
        type: 'fixed',
        bottom: '20px',
        right: '75px',
        zIndex: '9999'
      }
    });
    
    console.log('✅ UI components injected');
  }
  
  /**
   * Open settings dialog
   */
  private openSettings(): void {
    dialogManager.openDialog('settings');
  }
  
  /**
   * Save current conversation
   */
  private saveCurrentConversation(): void {
    // Get current chat service from the service manager
    const chatService = serviceManager.getService('chat');
    if (!chatService) {
      console.error('Chat service not available');
      return;
    }
    
    const chatId = chatService.getCurrentConversationId();
    if (!chatId) {
      // Use toast for notification
      toast.warning(
        chrome.i18n.getMessage('noActiveConversation') || 'No Active Conversation', 
        {
          description: chrome.i18n.getMessage('pleaseSelectConversation') || 'Please select a conversation first.'
        }
      );
      return;
    }
    
    // Use the service to save conversation data
    try {
      // Show success toast
      toast.success(
        chrome.i18n.getMessage('conversationSaved') || 'Conversation Saved', 
        {
          description: chrome.i18n.getMessage('conversationSavedSuccess') || 'Your conversation has been saved successfully.'
        }
      );
    } catch (error) {
      toast.error(
        chrome.i18n.getMessage('errorSavingConversation') || 'Error Saving Conversation', 
        {
          description: chrome.i18n.getMessage('problemSavingConversation') || 'There was a problem saving your conversation.'
        }
      );
    }
  }
  
  /**
   * Clean up all resources
   */
  public cleanup(): void {
    if (!this.isInitialized) return;
    
    console.log('🧹 Cleaning up Archimind application...');
    
    // Remove UI components
    componentInjector.removeAll();
    
    // Clean up services in reverse initialization order
    serviceManager.cleanupAll();
    
    // Clean up event manager
    eventManager.cleanup();
    
    this.isInitialized = false;
    console.log('✅ Archimind application cleaned up');
  }
}

// Export a singleton instance
export const appInitializer = AppInitializer.getInstance();

// Default export for module imports
export default {
  initialize: () => appInitializer.initialize(),
  cleanup: () => appInitializer.cleanup()
};