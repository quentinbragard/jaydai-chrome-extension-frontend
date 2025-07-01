// src/services/auth/TokenStorage.ts

import { AuthToken } from '@/types';

/**
 * Handles token storage operations
 */

export class TokenStorage {
  /**
   * Store authentication session
   */
  static storeAuthSession(session: AuthToken): Promise<void> {
    if (!session || !session.access_token || !session.refresh_token) {
      return Promise.reject(new Error('Incomplete session data'));
    }
    
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        token_expires_at: session.expires_at,
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
  
  /**
   * Get current token info
   */
  static getTokenInfo(): Promise<{
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: number;
  }> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['access_token', 'refresh_token', 'token_expires_at'], (result) => {
        resolve(result);
      });
    });
  }
  
  /**
   * Clear authentication data
   */
  static clearAuthData(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(
        ["access_token", "refresh_token", "token_expires_at"], 
        () => {
          resolve();
        }
      );
    });
  }
}