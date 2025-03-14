// src/services/auth/AuthService.ts

import { AppError, ErrorCode } from '@/core/errors/AppError';
import { emitEvent, AppEvent } from '@/core/events/events';
import { UserMetadata } from '@/types/user';
import { debug } from '@/core/config';

/**
 * Service for authentication and user management
 */
export class AuthService {
  private static instance: AuthService;

  
  private constructor() {}
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  /**
   * Initialize the auth service
   */
  public async initialize(): Promise<boolean> {
    try {
      // Try to get current user from storage
      const userId = await this.getUserId();
      if (!userId) {
        return false;
      }
      
      const token = await this.getAuthToken();
      if (!token) {
        return false;
      }
      
      // Successfully initialized
      return true;
    } catch (error) {
      console.error('Error initializing auth service:', error);
      return false;
    }
  }
  
  /**
   * Get current user ID
   */
  public async getUserId(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['user'], (result) => {
        resolve(result.user?.id || null);
      });
    });
  }
  
  /**
   * Get authentication token
   */
  public async getAuthToken(): Promise<string> {
    try {
        return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "getAuthToken" }, (response) => {
            if (chrome.runtime.lastError) {
            reject(new AppError(
                chrome.runtime.lastError.message || 'Unknown error',
                ErrorCode.AUTH_ERROR
            ));
            return;
            }
            
            if (!response || !response.success) {
            reject(new AppError(
                response?.error || 'Failed to get auth token',
                ErrorCode.AUTH_ERROR
            ));
            return;
            }
            
            resolve(response.token);
        });
        });
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw AppError.from(error, 'Failed to get auth token');
    }
  }
  
  /**
   * Refresh the auth token
   */
  public async refreshAuthToken(): Promise<string> {
    try {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: "refreshAuthToken" }, (response) => {
            if (chrome.runtime.lastError) {
                reject(new AppError(
                chrome.runtime.lastError.message || 'Unknown error',
                ErrorCode.AUTH_ERROR
            ));
            return;
            }
            
            if (!response || !response.success) {
            reject(new AppError(
                response?.error || 'Failed to refresh auth token',
                ErrorCode.TOKEN_EXPIRED
            ));
            return;
            }
            
            resolve(response.token);
        });
        });
    } catch (error) {
      console.error('Error refreshing auth token:', error);
      throw AppError.from(error, 'Failed to refresh auth token');
    }
  }
  
  
  /**
   * Sign out the user
   */
  public async signOut(): Promise<void> {
    try {
      // Clear stored credentials
      await new Promise<void>((resolve) => {
        chrome.storage.local.remove(['userId', 'access_token', 'refresh_token'], () => {
          resolve();
        });
      });
      
      // Emit logout event
      emitEvent(AppEvent.AUTH_LOGOUT, undefined);
      
      debug('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      throw AppError.from(error, 'Failed to sign out');
    }
  }
  
  /**
   * Get the current user
   */
  public getCurrentUser(): UserMetadata | null {
    return chrome.storage.local.get('user', (result) => {
      return result.user || null;
    });
  }
  
  /**
   * Check if user is signed in
   */
  public isSignedIn(): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser !== null;
  }
}

export const authService = AuthService.getInstance();