// src/services/auth/TokenRefresher.ts

import { TokenStorage } from './TokenStorage';

/**
 * Handles token refresh operations
 */

export class TokenRefresher {
  private static refreshTimer: number | null = null;
  
  /**
   * Force refresh the token
   */
  static async refreshToken(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "refreshAuthToken" }, (response) => {
        
        if (response.success) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }
  
  /**
   * Set up auto token refresh
   */
  static setupAutoRefresh(onRefresh: () => Promise<boolean>): void {
    // Clear any existing timer
    if (TokenRefresher.refreshTimer !== null) {
      clearTimeout(TokenRefresher.refreshTimer);
      TokenRefresher.refreshTimer = null;
    }
    
    // Get token expiration time
    TokenStorage.getTokenInfo().then((result) => {
      if (!result.token_expires_at) {
        return;
      }
      
      const expiresAt = result.token_expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      
      // Calculate refresh time (5 minutes before expiration)
      const refreshTime = expiresAt - now - (5 * 60 * 1000);
      
      
      if (refreshTime <= 0) {
        // Token already expired or about to expire, refresh now
        onRefresh();
        return;
      }
      
      // Set timer to refresh token
      TokenRefresher.refreshTimer = window.setTimeout(() => {
        onRefresh();
      }, refreshTime);
    });
  }
  
  /**
   * Clean up timers
   */
  static cleanup(): void {
    if (TokenRefresher.refreshTimer !== null) {
      clearTimeout(TokenRefresher.refreshTimer);
      TokenRefresher.refreshTimer = null;
    }
  }
}