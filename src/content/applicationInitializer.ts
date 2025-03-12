// src/content/applicationInitializer.ts
import { UrlChangeListener } from '@/services/UrlChangeListener';
import { statsService } from '@/services/StatsService';
import { templateService } from '@/services/TemplateService';
import { notificationService } from '@/services/NotificationService';
import { userInfoService } from '@/services/UserInfoService'; 
import { componentInjector } from '@/utils/componentInjector';
import { StatsPanel } from '@/components/StatsPanel';
import MainButton  from '@/components/MainButton';
import { getUserId } from '@/utils/auth';
import { SettingsDialog } from '@/components/SettingsDialog';
import React from 'react';
import { networkRequestMonitor } from '@/utils/NetworkRequestMonitor';
import { conversationListService } from '@/services/ConversationListService';
import { messageService } from '@/services/MessageService';

/**
 * Main application initializer
 * Coordinates the initialization of all services and components
 */
export class AppInitializer {
  private static instance: AppInitializer;
  private isInitialized: boolean = false;
  private isAuthenticating: boolean = false;
  private settingsOpen: boolean = false;
  private resizeHandler: (() => void) | null = null;
  
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
      // 1. Authenticate user
      const isAuthenticated = await this.authenticateUser();
      if (!isAuthenticated) {
        console.error('❌ User authentication failed');
        return false;
      }
      
      // 2. Initialize services
      await this.initializeServices();
      
      // 3. Inject UI components
      this.injectUIComponents();
      
      // 4. Set up message listeners
      this.setupMessageListeners();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Error initializing application:', error);
      return false;
    }
  }
  
  /**
   * Clean up all resources
   */
  public cleanup(): void {
    if (!this.isInitialized) return;
        
    // Clean up services
    statsService.cleanup();
    notificationService.cleanup();
    
    // Remove UI components
    componentInjector.removeAll();
    
    // Remove event listeners
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    
    this.isInitialized = false;
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
   * Initialize all services
   */
  private async initializeServices(): Promise<void> {
    
    // Initialize network monitoring first since other services depend on it
    networkRequestMonitor.initialize();
    
    
    // Initialize our new services
    conversationListService.initialize();
    messageService.initialize();
    
    // Initialize statistics service
    statsService.initialize();
    
    // Initialize template service
    await templateService.initialize();
    
    // Initialize notification service
    await notificationService.initialize();
    
    // Initialize user info service  
    userInfoService.initialize();
    }
  
  /**
   * Inject UI components
   */
  private injectUIComponents(): void {
    
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
    
    // Initial position update
    this.updateStatsPanelPosition();
    
    // Set up resize listener for responsive positioning
    this.resizeHandler = this.updateStatsPanelPosition.bind(this);
    window.addEventListener('resize', this.resizeHandler);
    
    // Also set up a MutationObserver to watch for DOM changes that might affect the composer div
    this.setupComposerObserver();
    
  }
  
  /**
   * Update the position of the stats panel to stay centered on the composer div
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
   * Setup MutationObserver to detect changes to the composer div or its parent
   */
  private setupComposerObserver(): void {
    // Monitor for changes that may affect layout
    const observer = new MutationObserver((mutations) => {
      // Update position when changes occur
      this.updateStatsPanelPosition();
    });
    
    // Start observing the document body for DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'width']
    });
    
    // Also set up a periodic check just to be safe (some dynamic changes may not trigger mutations)
    setInterval(() => this.updateStatsPanelPosition(), 2000);
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
    const chatId = UrlChangeListener.extractChatIdFromUrl(window.location.href);
    if (!chatId) {
      return;
    }
    
    try {
      // We don't need to do anything special here as the chat
      // and messages are already being saved automatically by the interceptor.
      // We could add some special behavior like forcing a save of unsaved messages.
      
      // Show a toast notification
      document.dispatchEvent(new CustomEvent('archimind:show-toast', {
        detail: {
          title: 'Conversation Saved',
          description: 'Your conversation has been saved successfully.',
          type: 'success'
        }
      }));
    } catch (error) {
      console.error('❌ Error saving conversation:', error);
    }
  }
  
  /**
   * Set up message listeners for internal communication
   */
  private setupMessageListeners(): void {
    // Listen for notification count changes
    document.addEventListener('archimind:notification-count-changed', (event: CustomEvent) => {
      const { unreadCount } = event.detail;
      
      // Update badge on main button
      document.dispatchEvent(new CustomEvent('archimind:update-badge', {
        detail: { count: unreadCount }
      }));
    });
    
    // Listen for Chrome extension messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'applySettings') {
        // Apply settings changes
        this.applySettings(message.settings);
        sendResponse({ success: true });
      } else if (message.action === 'saveChatNow') {
        // Force save the current conversation
        this.saveCurrentConversation();
        sendResponse({ success: true });
      } else if (message.action === 'reinitialize') {
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
    
    
    // Example settings implementation
    if (settings.statsVisible !== undefined) {
      const statsPanel = document.getElementById('archimind-stats-panel');
      if (statsPanel) {
        statsPanel.style.display = settings.statsVisible ? 'block' : 'none';
      }
    }
    
    // You can implement other settings as needed
  }
}

// Export a singleton instance
export const appInitializer = AppInitializer.getInstance();

// Default export for module imports
export default {
  initialize: () => appInitializer.initialize(),
  cleanup: () => appInitializer.cleanup()
};