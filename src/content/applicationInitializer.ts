// src/content/applicationInitializer.ts
import { chatInterceptor } from '@/services/ChatInterceptorService';
import { statsService } from '@/services/StatsService';
import { templateService } from '@/services/TemplateService';
import { notificationService } from '@/services/NotificationService';
import { componentInjector } from '@/utils/componentInjector';
import { StatsPanel } from '@/components/StatsPanel';
import { MainButton } from '@/components/MainButton';
import { getUserId } from '@/utils/auth';
import { SettingsDialog } from '@/components/SettingsDialog';
import React from 'react';

/**
 * Main application initializer
 * Coordinates the initialization of all services and components
 */
export class AppInitializer {
  private static instance: AppInitializer;
  private isInitialized: boolean = false;
  private isAuthenticating: boolean = false;
  private settingsOpen: boolean = false;
  
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
      console.log('⚠️ Application already initialized');
      return true;
    }
    
    // Skip if we're not on ChatGPT
    if (!this.isChatGPTSite()) {
      console.log('⚠️ Not on ChatGPT, skipping initialization');
      return false;
    }
    
    console.log('🚀 Initializing Archimind application...');
    
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
      console.log('✅ Archimind application initialized successfully');
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
    
    console.log('🧹 Cleaning up Archimind application...');
    
    // Clean up services
    chatInterceptor.cleanup();
    statsService.cleanup();
    notificationService.cleanup();
    
    // Remove UI components
    componentInjector.removeAll();
    
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
      console.log('🔑 Authenticating user...');
      
      // Check for user ID in storage
      const userId = await getUserId();
      
      if (!userId) {
        console.log('⚠️ No user ID found, user not authenticated');
        this.isAuthenticating = false;
        return false;
      }
      
      console.log('✅ User authenticated:', userId);
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
    console.log('🔧 Initializing services...');
    
    // Initialize chat interception
    chatInterceptor.initialize();
    
    // Initialize statistics service
    statsService.initialize();
    
    // Initialize template service
    await templateService.initialize();
    
    // Initialize notification service
    await notificationService.initialize();
    
    console.log('✅ Services initialized');
  }
  
  /**
   * Inject UI components
   */
  private injectUIComponents(): void {
    console.log('🖼️ Injecting UI components...');
    
    // Inject the Stats Panel in the top-right corner
    componentInjector.inject(StatsPanel, {}, {
        id: 'archimind-stats-panel',
        position: {
          type: 'fixed',
          top: '20px',
          left: '50%',
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
        bottom: '20px',
        right: '20px',
        zIndex: '9999'
      }
    });
    
    console.log('✅ UI components injected');
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
    const chatId = chatInterceptor.getCurrentChatId();
    if (!chatId) {
      console.log('⚠️ No active conversation to save');
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
    
    console.log('⚙️ Applying settings:', settings);
    
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