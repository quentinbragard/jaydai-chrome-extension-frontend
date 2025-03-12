// src/content/applicationInitializer.ts
import { statsService } from '@/services/StatsService';
import { templateService } from '@/services/TemplateService';
import { notificationService } from '@/services/NotificationService';
import { userInfoService } from '@/services/UserInfoService'; 
import { componentInjector } from '@/utils/componentInjector';
import { StatsPanel } from '@/components/StatsPanel';
import MainButton from '@/components/MainButton';
import { getUserId } from '@/utils/auth';
import { SettingsDialog } from '@/components/SettingsDialog';
import React from 'react';
import { networkRequestMonitor } from '@/utils/NetworkRequestMonitor';
import { messageService } from '@/services/MessageService';
import { batchSaveService } from '@/services/BatchSaveService';
import { UrlChangeListener } from '@/services/UrlChangeListener';
import { conversationHandler } from '@/services/handlers/ConversationHandler';
import { specificConversationHandler } from '@/services/handlers/SpecificConversationHandler';
import { chatListScanner } from '@/utils/ChatListScanner';



/**
 * Main application initializer - optimized for performance
 * Coordinates the initialization of all services and components
 */
export class AppInitializer {
  private static instance: AppInitializer;
  private isInitialized: boolean = false;
  private isAuthenticating: boolean = false;
  private settingsOpen: boolean = false;
  private resizeHandler: (() => void) | null = null;
  private observerTimeout: number | null = null;
  private statsPanelUpdateTimeout: number | null = null;
  private mutationObserver: MutationObserver | null = null;
  
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
 * Initialize the application with performance optimizations
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
    
    // 1. First authenticate user - must be done synchronously 
    const isAuthenticated = await this.authenticateUser();
    if (!isAuthenticated) {
      console.error('❌ User authentication failed');
      return false;
    }
    
    // 2. Initialize essential core services first
    await this.initializeCoreServices();
    
    // 3. Inject UI components after a delay to allow page to load
    setTimeout(() => {
      this.injectUIComponents();
    }, 800);
    
    // 4. Initialize secondary services with a delay
    setTimeout(() => {
      this.initializeSecondaryServices();
    }, 1500);
    
    // 5. Set up URL change monitoring
    this.setupUrlChangeMonitoring();
    
    this.setupMessageListeners();
    
    // 7. IMPORTANT: Scan the sidebar for all existing chats and save in batch
    // Do this with a sufficient delay to ensure the sidebar is loaded
    setTimeout(() => {
      chatListScanner.scanAndSaveChatList();
    }, 3000);
    
    this.isInitialized = true;
    console.log('✅ Archimind application initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing application:', error);
    return false;
  }
}

/**
 * Initialize core services - those needed immediately
 */
private async initializeCoreServices(): Promise<void> {
  console.log('🔧 Initializing core services...');
  
  // Initialize network monitoring first since other services depend on it
  networkRequestMonitor.initialize();
  
  // Initialize batch save service
  batchSaveService.initialize();
  
  // Initialize message service - critical for capturing chat data
  messageService.initialize();

   // Set up specific endpoint listeners for conversation data
   this.setupSpecificEndpointListeners();
  
  console.log('✅ Core services initialized');
}

/**
 * Set up listeners for specific API endpoints
 */
private setupSpecificEndpointListeners(): void {
  // Add listener for specific conversation endpoint (using regex pattern)
  const specificConversationRegex = /\/backend-api\/conversation\/[a-zA-Z0-9-]+$/;
  networkRequestMonitor.addListener(specificConversationRegex, (data) => {
    specificConversationHandler.processSpecificConversation(data);
  });
  
  // Also listen for the specific event type
  networkRequestMonitor.addListener('specificConversation', (data) => {
    specificConversationHandler.processSpecificConversation(data);
  });
  
  console.log('✅ Specific endpoint listeners set up');
}


/**
 * Set up URL change monitoring to detect navigation between chats
 */
private setupUrlChangeMonitoring(): void {
  // Create URL change listener
  const urlListener = new UrlChangeListener({
    onUrlChange: (newUrl) => {
      console.log(`🔍 URL changed: ${newUrl}`);
      
      // Extract chatId from URL
      const chatId = UrlChangeListener.extractChatIdFromUrl(newUrl);
      if (chatId) {
        // Set as current chat
        conversationHandler.setCurrentChatId(chatId);
      }
    }
  });
  
  // Start listening for URL changes
  urlListener.startListening();
}
  
  /**
   * Clean up all resources
   */
  public cleanup(): void {
    if (!this.isInitialized) return;
    
    console.log('🧹 Cleaning up Archimind application...');

    chatListScanner.resetScan();


    
    
    // Force save any pending changes
    batchSaveService.forceSave();
  
   // Clean up batch save service
    batchSaveService.cleanup();
    
    // Clear any pending timeouts
    if (this.observerTimeout !== null) {
      clearTimeout(this.observerTimeout);
      this.observerTimeout = null;
    }
    
    if (this.statsPanelUpdateTimeout !== null) {
      clearTimeout(this.statsPanelUpdateTimeout);
      this.statsPanelUpdateTimeout = null;
    }
    
    // Disconnect mutation observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    
    // Clean up services
    statsService.cleanup();
    notificationService.cleanup();
    messageService.cleanup();
    networkRequestMonitor.cleanup();
    
    // Remove UI components
    componentInjector.removeAll();
    
    // Remove event listeners
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    
    // Remove event listener for network intercept
    document.removeEventListener('archimind-network-intercept', 
      this.handleNetworkIntercept as EventListener);
    
    this.isInitialized = false;
    console.log('✅ Archimind application cleaned up');
  }
  
  /**
   * Check if we're on ChatGPT
   */
  private isChatGPTSite(): boolean {
    return window.location.hostname.includes('chatgpt.com') || 
           window.location.hostname.includes('chat.openai.com');
  }
  
  /**
   * Authenticate the user
   */
  private async authenticateUser(): Promise<boolean> {
    if (this.isAuthenticating) {
      return new Promise((resolve) => {
        // Poll until authentication is complete
        const checkInterval = setInterval(() => {
          if (!this.isAuthenticating) {
            clearInterval(checkInterval);
            resolve(this.isAuthenticated());
          }
        }, 100);
      });
    }
    
    this.isAuthenticating = true;
    
    try {
      // Check for user ID in storage
      const userId = await getUserId();
      
      if (!userId) {
        this.isAuthenticating = false;
        return false;
      }
      
      this.isAuthenticating = false;
      return true;
    } catch (error) {
      console.error('❌ Error authenticating user:', error);
      this.isAuthenticating = false;
      return false;
    }
  }
  
  /**
   * Check if user is authenticated
   */
  private isAuthenticated(): boolean {
    // For simplicity, we'll just check if we can get a user ID
    return !!localStorage.getItem('userId');
  }
  

  /**
   * Handle network intercept events
   */
  private handleNetworkIntercept(event: CustomEvent): void {
    // Don't need to do anything here yet - just a stub
    // This could be used later for monitoring specific events
  }
  
  /**
   * Initialize secondary services - those that can be delayed
   */
  private async initializeSecondaryServices(): Promise<void> {
    console.log('🔧 Initializing secondary services...');
    
    // Initialize with a chain of promises to spread the load
    try {
      
      // Initialize template service
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          templateService.initialize();
          resolve();
        }, 300);
      });
      
      // Initialize notification service
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          notificationService.initialize();
          resolve();
        }, 300);
      });
      
      // Initialize user info service  
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          userInfoService.initialize();
          resolve();
        }, 300);
      });
      
      // Initialize statistics service last
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          statsService.initialize();
          resolve();
        }, 300);
      });
      
      console.log('✅ Secondary services initialized');
    } catch (error) {
      console.error('❌ Error initializing secondary services:', error);
    }
  }
  
  /**
   * Inject UI components
   */
  private injectUIComponents(): void {
    console.log('🔧 Injecting UI components...');
    
    // Inject the Stats Panel centered above the composer
    componentInjector.inject(StatsPanel, {}, {
      id: 'archimind-stats-panel',
      position: {
        type: 'fixed',
        top: '5px',
        left: '50%', // Will be updated by updateStatsPanelPosition
        zIndex: '10000'
      },
      containerStyle: {
        transform: 'translateX(-50%)' // Center horizontally
      }
    });
    
    // Inject the Main Button in the bottom-right corner
    componentInjector.inject(MainButton, {
      onSettingsClick: () => this.openSettings(),
      onSaveClick: () => this.saveCurrentConversation()
    }, {
      id: 'archimind-main-button',
      position: {
        type: 'fixed',
        bottom: '10px',
        right: '75px',
        zIndex: '9999'
      }
    });
    
    // Initial position update - with slight delay for layout to settle
    setTimeout(() => {
      this.updateStatsPanelPosition();
    }, 500);
    
    // Set up debounced resize listener for responsive positioning
    this.resizeHandler = this.debouncedUpdatePosition.bind(this);
    window.addEventListener('resize', this.resizeHandler);
    
    // Setup a lighter, optimized MutationObserver
    this.setupLightMutationObserver();
    
    console.log('✅ UI components injected');
  }
  
  /**
   * Debounced version of updateStatsPanelPosition
   */
  private debouncedUpdatePosition(): void {
    // Cancel any pending update
    if (this.statsPanelUpdateTimeout !== null) {
      clearTimeout(this.statsPanelUpdateTimeout);
    }
    
    // Schedule new update
    this.statsPanelUpdateTimeout = window.setTimeout(() => {
      this.updateStatsPanelPosition();
      this.statsPanelUpdateTimeout = null;
    }, 100);
  }
  
  /**
   * Update the position of the stats panel to stay centered
   */
  private updateStatsPanelPosition(): void {
    // Find the composer parent element
    const composerDiv = document.querySelector('div[role="presentation"].composer-parent');
    if (!composerDiv) return;
    
    // Get the center position of the composer div
    const composerRect = composerDiv.getBoundingClientRect();
    const centerX = composerRect.x + (composerRect.width / 2);
    
    // Get the stats panel container
    const statsPanel = document.getElementById('archimind-stats-panel-container');
    if (!statsPanel) return;
    
    // Update the left position to keep it centered
    statsPanel.style.left = `${centerX}px`;
  }
  
  /**
   * Setup a lighter MutationObserver that doesn't bog down the page
   */
  private setupLightMutationObserver(): void {
    // Clear any existing observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    
    // Create a new observer
    this.mutationObserver = new MutationObserver((mutations) => {
      // Check if any of the mutations affect layout
      const layoutChanged = mutations.some(mutation => {
        // Only care about changes to class, style, or width attributes
        if (mutation.type === 'attributes') {
          const attrName = mutation.attributeName;
          return attrName === 'class' || attrName === 'style' || attrName === 'width';
        }
        return false;
      });
      
      // Only update if layout changed
      if (layoutChanged) {
        this.debouncedUpdatePosition();
      }
    });
    
    // Start observing with a delay to ensure page is loaded
    this.observerTimeout = window.setTimeout(() => {
      // Only observe the main area of the page
      const mainArea = document.querySelector('main');
      if (mainArea && this.mutationObserver) {
        this.mutationObserver.observe(mainArea, {
          childList: false, // Don't need to watch children
          subtree: false,   // Don't need to watch deeply
          attributes: true, // Only need to watch attributes
          attributeFilter: ['class', 'style', 'width'] // Only these attributes
        });
      }
      this.observerTimeout = null;
    }, 2000);
  }
  
  /**
   * Open settings dialog
   */
  private openSettings(): void {
    if (this.settingsOpen) return;
    
    this.settingsOpen = true;
    
    // Inject the Settings Dialog
    componentInjector.inject(
      (props) => React.createElement(SettingsDialog, {
        open: true,
        onOpenChange: (open) => {
          if (!open) {
            this.settingsOpen = false;
            // Remove dialog when closed
            componentInjector.remove('archimind-settings-dialog');
          }
        },
        ...props
      }),
      {},
      { id: 'archimind-settings-dialog' }
    );
  }
  
  /**
   * Save current conversation
   */
  private saveCurrentConversation(): void {
    // Don't actually do anything here - just show a toast
    document.dispatchEvent(new CustomEvent('archimind:show-toast', {
      detail: {
        title: 'Conversation Saved',
        description: 'Your conversation has been saved successfully.',
        type: 'success'
      }
    }));
  }
  
  /**
   * Set up message listeners for internal communication
   */
  private setupMessageListeners(): void {
    // Listen for Chrome extension messages - with optimization
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'applySettings') {
        // Process settings asynchronously
        setTimeout(() => {
          this.applySettings(message.settings);
          sendResponse({ success: true });
        }, 0);
        return true; // Keep channel open for async response
      } 
      else if (message.action === 'reinitialize') {
        // Reinitialize the application
        this.cleanup();
        this.initialize().then(success => {
          sendResponse({ success });
        });
        return true; // Keep channel open for async response
      }
    });
  }
  
  /**
   * Apply settings changes
   */
  private applySettings(settings: any): void {
    if (!settings) return;
    
    // Process settings with slight delay to avoid UI thread blocking
    setTimeout(() => {
      if (settings.statsVisible !== undefined) {
        const statsPanel = document.getElementById('archimind-stats-panel');
        if (statsPanel) {
          statsPanel.style.display = settings.statsVisible ? 'block' : 'none';
        }
      }
      
      // Apply other settings as needed
    }, 0);
  }
}

// Export a singleton instance
export const appInitializer = AppInitializer.getInstance();

// Default export for module imports
export default {
  initialize: () => appInitializer.initialize(),
  cleanup: () => appInitializer.cleanup()
};