// src/services/UserInfoService.ts
import { userHandler } from '@/services/handlers/UserHandler';
import { networkRequestMonitor } from '@/utils/NetworkRequestMonitor';

/**
 * Service to fetch and process user information
 */
export class UserInfoService {
  private static instance: UserInfoService;
  private fetchedUserInfo: boolean = false;
  private storageKey: string = 'archimind_user_info';
  private cleanupListeners: (() => void)[] = [];
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): UserInfoService {
    if (!UserInfoService.instance) {
      UserInfoService.instance = new UserInfoService();
    }
    return UserInfoService.instance;
  }
  
  /**
   * Initialize the service - fetch user info
   */
  public initialize(): void {
    // First try to get from storage
    this.getUserInfoFromStorage().then(data => {
      if (data) {
        userHandler.processUserInfo(data);
        this.fetchedUserInfo = true;
      }
    });
    
    // Initialize network request monitoring
    networkRequestMonitor.initialize();
    
    // Listen specifically for /backend-api/me responses
    const removeUserInfoListener = networkRequestMonitor.addListener(
      '/backend-api/me',
      this.handleUserInfoCapture.bind(this)
    );
    this.cleanupListeners.push(removeUserInfoListener);
    
    // Also listen for conversations responses which sometimes include user data
    const removeConversationsListener = networkRequestMonitor.addListener(
      '/backend-api/conversations',
      this.handleConversationsCapture.bind(this)
    );
    this.cleanupListeners.push(removeConversationsListener);
    
    // Add event listener for user data from injected script
    document.addEventListener('archimind-network-intercept', this.handleInterceptEvent.bind(this));
  }
  
  /**
   * Handle user info captured by network monitor
   */
  private handleUserInfoCapture(data: any): void {
    if (!data || !data.responseBody) return;

    const userData = data.responseBody;
    
    // Verify this is complete user data with email
    if (userData && userData.email && userData.email !== '') {
      userHandler.processUserInfo(userData);
      this.fetchedUserInfo = true;
      this.saveUserInfoToStorage(userData);
    }
  }
  
  /**
   * Handle conversations response which might contain user data
   */
  private handleConversationsCapture(data: any): void {
    if (!data || !data.responseBody) return;
    
    try {
      const responseData = data.responseBody;
      
      // Look for user data in the response
      const userData = responseData.user || responseData.viewer || responseData.current_user;
      
      if (userData && userData.id && userData.email && userData.email !== '') {
        userHandler.processUserInfo(userData);
        this.fetchedUserInfo = true;
        this.saveUserInfoToStorage(userData);
      }
    } catch (error) {
      console.error('Error processing conversations data:', error);
    }
  }
  
  /**
   * Handle events from the network interceptor
   */
  private handleInterceptEvent(event: any): void {
    if (!event.detail || event.detail.type !== 'userInfo' || !event.detail.data) {
      return;
    }
    
    const data = event.detail.data;
    if (!data.responseBody) return;
    
    const userData = data.responseBody;
    
    // Check if this is complete user info
    if (userData && userData.email && userData.email !== '') {
      userHandler.processUserInfo(userData);
      this.fetchedUserInfo = true;
      this.saveUserInfoToStorage(userData);
    }
  }
  
  /**
   * Save user info to extension storage
   */
  private saveUserInfoToStorage(userData: any): void {
    try {
      // Save to chrome.storage
      chrome.storage.local.set({ [this.storageKey]: userData });
    } catch (error) {
      console.error('Error saving user info to storage:', error);
    }
  }
  
  /**
   * Get user info from storage
   */
  private async getUserInfoFromStorage(): Promise<any> {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get([this.storageKey], (result) => {
          if (result && result[this.storageKey]) {
            resolve(result[this.storageKey]);
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Error getting user info from storage:', error);
      return null;
    }
  }
  
  /**
   * Force a refresh of the user info
   */
  public refreshUserInfo(): void {
    this.fetchedUserInfo = false;
    
    // Clear from storage
    chrome.storage.local.remove([this.storageKey]);
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Remove all listeners
    this.cleanupListeners.forEach(cleanup => cleanup());
    this.cleanupListeners = [];
    
    // Clean up network monitor
    networkRequestMonitor.cleanup();
    
    // Remove event listener
    document.removeEventListener('archimind-network-intercept', this.handleInterceptEvent.bind(this));
  }
}

// Export a singleton instance
export const userInfoService = UserInfoService.getInstance();