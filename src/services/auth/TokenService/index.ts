// src/services/auth/TokenService.ts
import { AbstractBaseService } from '@/services/BaseService';
import { debug } from '@/core/config';
import { TokenResponse, AuthToken } from '@/types';
import { TokenStorage } from './TokenStorage';
import { TokenRefresher } from './TokenRefresher';

/**
 * Service for managing authentication tokens
 * Handles token refresh, storage, and expiration
 */
export class TokenService extends AbstractBaseService {
  private static instance: TokenService;
  
  private constructor() {
    super();
  }
  
  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }
  
  /**
   * Initialize token management
   */
  protected async onInitialize(): Promise<void> {
    debug('Initializing TokenService');
    
    // Set up auto token refresh
    TokenRefresher.setupAutoRefresh(() => this.refreshToken());
  }
  
  /**
   * Clean up resources
   */
  protected onCleanup(): void {
    TokenRefresher.cleanup();
    debug('TokenService cleaned up');
  }
  
  /**
   * Get the current auth token, refreshing if necessary
   */
  public async getAuthToken(): Promise<TokenResponse> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getAuthToken" }, (response) => {
        resolve(response);
      });
    });
  }
  
  /**
   * Force refresh the token
   */
  public async refreshToken(): Promise<boolean> {
    const success = await TokenRefresher.refreshToken();
    
    if (success) {
      // Set up auto refresh for the new token
      TokenRefresher.setupAutoRefresh(() => this.refreshToken());
    }
    
    return success;
  }
  
  /**
   * Store authentication session
   */
  public async storeAuthSession(session: AuthToken): Promise<void> {
    await TokenStorage.storeAuthSession(session);
    
    // Set up refresh timer
    TokenRefresher.setupAutoRefresh(() => this.refreshToken());
  }
  
  /**
   * Clear authentication data
   */
  public async clearAuthData(callback?: () => void): Promise<void> {
    await TokenStorage.clearAuthData();
    TokenRefresher.cleanup();
    
    if (callback) callback();
  }
}
