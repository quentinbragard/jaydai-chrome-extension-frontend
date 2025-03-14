// src/services/UserInfoService.ts
import { UserMetadata } from '@/types/chat';
import { networkRequestMonitor } from '@/core/network/NetworkRequestMonitor';
import { userApi } from '@/api';
import { emitEvent, AppEvent } from '@/core/events/events';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { debug } from '@/core/config';

/**
 * Service to fetch and process user information
 */
export class UserInfoService {
  private static instance: UserInfoService;
  private fetchedUserInfo: boolean = false;
  private storageKey: string = 'archimind_user_info';
  private cleanupListeners: (() => void)[] = [];
  private userInfo: UserMetadata | null = null;
  
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
    debug('Initializing UserInfoService');
    
    // First try to get from storage
    this.getUserInfoFromStorage().then(data => {
      if (data) {
        this.processUserInfo(data);
        this.fetchedUserInfo = true;
      }
    });
    
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
    
    debug('UserInfoService initialized');
  }
  
  /**
   * Handle user info captured by network monitor
   */
  public handleUserInfoCapture(data: any): void {
    try {
      debug('User info captured');
      
      if (!data || !data.responseBody) return;
      
      const userData = data.responseBody;
      
      // Verify this is complete user data with email
      if (userData && userData.email && userData.email !== '') {
        this.processUserInfo(userData);
        this.fetchedUserInfo = true;
        this.saveUserInfoToStorage(userData);
        
        // Emit event for other components
        emitEvent(AppEvent.USER_INFO_UPDATED, {
          email: userData.email,
          name: userData.name || userData.email.split('@')[0]
        });
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling user info capture', ErrorCode.API_ERROR, error)
      );
    }
  }
  
  /**
   * Handle conversations response which might contain user data
   */
  private handleConversationsCapture(data: any): void {
    try {
      if (!data || !data.responseBody) return;
      
      const responseData = data.responseBody;
      
      // Look for user data in the response
      const userData = responseData.user || responseData.viewer || responseData.current_user;
      
      if (userData && userData.id && userData.email && userData.email !== '') {
        this.processUserInfo(userData);
        this.fetchedUserInfo = true;
        this.saveUserInfoToStorage(userData);
        
        // Emit event for other components
        emitEvent(AppEvent.USER_INFO_UPDATED, {
          email: userData.email,
          name: userData.name || userData.email.split('@')[0]
        });
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error processing conversations data', ErrorCode.API_ERROR, error)
      );
    }
  }
  
  /**
   * Handle events from the network interceptor
   */
  private handleInterceptEvent(event: any): void {
    try {
      if (!event.detail || event.detail.type !== 'userInfo' || !event.detail.data) {
        return;
      }
      
      const data = event.detail.data;
      if (!data.responseBody) return;
      
      const userData = data.responseBody;
      
      // Check if this is complete user info
      if (userData && userData.email && userData.email !== '') {
        this.processUserInfo(userData);
        this.fetchedUserInfo = true;
        this.saveUserInfoToStorage(userData);
        
        // Emit event for other components
        emitEvent(AppEvent.USER_INFO_UPDATED, {
          email: userData.email,
          name: userData.name || userData.email.split('@')[0]
        });
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error handling intercept event', ErrorCode.EXTENSION_ERROR, error)
      );
    }
  }
  
  /**
   * Save user info to extension storage
   */
  private saveUserInfoToStorage(userData: any): void {
    try {
      // Save to chrome.storage
      chrome.storage.local.set({ [this.storageKey]: userData });
      debug('User info saved to storage');
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error saving user info to storage', ErrorCode.STORAGE_ERROR, error)
      );
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
            debug('Retrieved user info from storage');
            resolve(result[this.storageKey]);
          } else {
            debug('No user info found in storage');
            resolve(null);
          }
        });
      });
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error getting user info from storage', ErrorCode.STORAGE_ERROR, error)
      );
      return null;
    }
  }
  
  /**
   * Process user information from API
   */
  public processUserInfo(data: any): void {
    try {
      if (!data || !data.id || !data.email) {
        return;
      }
      
      // Extract org name if available
      let orgName = null;
      if (data.orgs && data.orgs.data && data.orgs.data.length > 0) {
        orgName = data.orgs.data[0].title || null;
      }
      
      // Build user metadata
      this.userInfo = {
        id: data.id,
        email: data.email,
        name: data.name || data.email.split('@')[0],
        picture: data.picture || null,
        phone_number: data.phone_number || null,
        org_name: orgName
      };
      
      // Save to backend
      this.saveUserMetadataToBackend();
      
      debug('User info processed successfully');
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error processing user info', ErrorCode.VALIDATION_ERROR, error)
      );
    }
  }
  
  /**
   * Get the current user info
   */
  public getUserInfo(): UserMetadata | null {
    return this.userInfo;
  }
  
  /**
   * Save user metadata to backend
   */
  private saveUserMetadataToBackend(): void {
    if (!this.userInfo) return;
    
    try {
      // Use the userApi from our new API structure instead of apiService
      userApi.saveUserMetadata({
        email: this.userInfo.email,
        name: this.userInfo.name,
        phone_number: this.userInfo.phone_number || undefined,
        org_name: this.userInfo.org_name || undefined,
        picture: this.userInfo.picture || undefined
      })
      .then(() => {
        debug('User metadata saved to backend');
      })
      .catch(error => {
        errorReporter.captureError(
          new AppError('Error saving user metadata', ErrorCode.API_ERROR, error)
        );
      });
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error preparing user metadata save', ErrorCode.UNKNOWN_ERROR, error)
      );
    }
  }
  
  /**
   * Force a refresh of the user info
   */
  public refreshUserInfo(): void {
    this.fetchedUserInfo = false;
    
    // Clear from storage
    chrome.storage.local.remove([this.storageKey]);
    debug('User info refreshed');
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Remove all listeners
    this.cleanupListeners.forEach(cleanup => cleanup());
    this.cleanupListeners = [];
    
    // Remove event listener
    document.removeEventListener('archimind-network-intercept', this.handleInterceptEvent.bind(this));
    
    debug('UserInfoService cleaned up');
  }
}

// Export a singleton instance
export const userInfoService = UserInfoService.getInstance();