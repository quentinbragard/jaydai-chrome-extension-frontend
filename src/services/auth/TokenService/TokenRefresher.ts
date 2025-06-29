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
        console.log('Token refresh response:', response.success ? 'success' : 'failed');
        
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
        console.log('No token expiration time found');
        return;
      }
      
      const expiresAt = result.token_expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      
      // Calculate refresh time (5 minutes before expiration)
      const refreshTime = expiresAt - now - (5 * 60 * 1000);
      
      console.log(`Token expires in ${Math.floor((expiresAt - now) / 1000 / 60)} minutes`);
      
      if (refreshTime <= 0) {
        // Token already expired or about to expire, refresh now
        console.log('Token expired or expiring soon, refreshing now');
        onRefresh();
        return;
      }
      
      // Set timer to refresh token
      console.log(`Scheduling token refresh in ${Math.floor(refreshTime / 1000 / 60)} minutes`);
      TokenRefresher.refreshTimer = window.setTimeout(() => {
        console.log('Auto-refreshing token');
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