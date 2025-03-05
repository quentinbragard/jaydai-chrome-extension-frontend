// src/services/UserInfoService.ts
import { userHandler } from '@/services/chat/handlers/UserHandler';
import { networkRequestMonitor } from '@/utils/NetworkRequestMonitor';

/**
 * Service to fetch and process user information
 */
export class UserInfoService {
  private static instance: UserInfoService;
  private fetchedUserInfo: boolean = false;
  private fetchAttempts: number = 0;
  private maxAttempts: number = 5;
  private retryDelay: number = 2000;
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
    console.log('👤 Initializing user info service...');
    
    // First try to get from storage
    this.getUserInfoFromStorage().then(data => {
      if (data) {
        console.log('✅ Using cached user info from storage');
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
    
    // Try standard fetch as well (might get partial data)
    setTimeout(() => {
      if (!this.fetchedUserInfo) {
        this.fetchUserInfo();
      }
    }, 2000);
    
    // Add event listener for user data from injected script
    document.addEventListener('archimind-network-intercept', this.handleInterceptEvent.bind(this));
    
    console.log('👤 User info service initialized, waiting for data...');
  }
  
  /**
   * Handle user info captured by network monitor
   */
  private handleUserInfoCapture(data: any): void {
    if (!data || !data.responseBody) return;
    
    console.log('🔍 Captured /backend-api/me response:', data);
    
    const userData = data.responseBody;
    
    // Verify this is complete user data with email
    if (userData && userData.email && userData.email !== '') {
      console.log('✅ Successfully captured complete user info from network');
      userHandler.processUserInfo(userData);
      this.fetchedUserInfo = true;
      this.saveUserInfoToStorage(userData);
    } else {
      console.log('⚠️ Captured user info is incomplete, waiting for complete data');
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
        console.log('✅ Found user data in conversations response');
        userHandler.processUserInfo(userData);
        this.fetchedUserInfo = true;
        this.saveUserInfoToStorage(userData);
      }
    } catch (error) {
      console.error('❌ Error processing conversations data:', error);
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
    
    console.log('🔍 Received intercepted user info event:', data);
    
    const userData = data.responseBody;
    
    // Check if this is complete user info
    if (userData && userData.email && userData.email !== '') {
      console.log('✅ Received complete user info from interceptor');
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
      chrome.storage.local.set({ [this.storageKey]: userData }, () => {
        console.log('✅ Saved user info to extension storage');
      });
    } catch (error) {
      console.error('❌ Error saving user info to storage:', error);
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
            console.log('✅ Found user info in extension storage');
            resolve(result[this.storageKey]);
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error getting user info from storage:', error);
      return null;
    }
  }
  
  /**
   * Fetch user info using standard fetch (might get partial data)
   */
  private async fetchUserInfo(): Promise<void> {
    if (this.fetchedUserInfo || this.fetchAttempts >= this.maxAttempts) {
      return;
    }
    
    this.fetchAttempts++;
    console.log(`👤 Trying standard fetch for user info (attempt ${this.fetchAttempts}/${this.maxAttempts})...`);
    
    try {
      const response = await fetch('/backend-api/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log(`Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Standard fetch response:', data);
      
      // If we got a valid user object with real data (not empty fields)
      if (data && data.id && data.email && data.email !== '') {
        console.log('✅ Successfully fetched complete user info with standard fetch');
        userHandler.processUserInfo(data);
        this.fetchedUserInfo = true;
        this.saveUserInfoToStorage(data);
        return;
      }
      
      console.log('⚠️ Standard fetch returned incomplete user data');
      
      // Try again after delay
      if (this.fetchAttempts < this.maxAttempts) {
        const delay = this.retryDelay * Math.pow(1.5, this.fetchAttempts - 1);
        setTimeout(() => this.fetchUserInfo(), delay);
      }
    } catch (error) {
      console.error('❌ Error in standard fetch:', error);
      
      // Try again after delay
      if (this.fetchAttempts < this.maxAttempts) {
        const delay = this.retryDelay * Math.pow(1.5, this.fetchAttempts - 1);
        setTimeout(() => this.fetchUserInfo(), delay);
      }
    }
  }
  
  /**
   * Force a refresh of the user info
   */
  public refreshUserInfo(): void {
    this.fetchAttempts = 0;
    this.fetchedUserInfo = false;
    
    // Clear from storage
    chrome.storage.local.remove([this.storageKey]);
    
    // Try standard fetch
    this.fetchUserInfo();
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
  }
}

// Export a singleton instance
export const userInfoService = UserInfoService.getInstance();