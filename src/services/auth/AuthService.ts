// src/services/auth/AuthService.ts

import { toast } from "sonner";

// Types
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth error codes
export enum AuthErrorCode {
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  REFRESH_TOKEN_MISSING = 'REFRESH_TOKEN_MISSING',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  REFRESH_FAILED = 'REFRESH_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
}

// Authentication service class
class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  };
  private authListeners: Set<(state: AuthState) => void> = new Set();
  
  // Auto session refresh timer
  private refreshTimer: number | null = null;
  
  // Make constructor private to enforce singleton
  private constructor() {}
  
  // Get the singleton instance
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  /**
   * Initialize the auth service by checking if user is authenticated
   */
  public async initialize(): Promise<boolean> {
    this.updateState({ isLoading: true, error: null });
    
    try {
      // Try to get the auth token, which will refresh it if necessary
      const tokenResponse = await this.getAuthToken();
      
      if (!tokenResponse.success) {
        // Not authenticated or token refresh failed
        this.updateState({ 
          isAuthenticated: false, 
          isLoading: false,
          error: tokenResponse.error || null,
          user: null
        });
        return false;
      }
      
      // Get user data from storage
      const user = await this.getUserFromStorage();
      
      this.updateState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
        user
      });
      
      // Set up auto token refresh
      this.setupAutoRefresh();
      
      return true;
    } catch (error) {
      console.error('Auth initialization error:', error);
      
      this.updateState({
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication error',
        user: null
      });
      
      return false;
    }
  }
  
  /**
   * Get the current auth token, refreshing if necessary
   */
  public async getAuthToken(): Promise<{ success: boolean, token?: string, error?: string, errorCode?: string }> {
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
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "refreshAuthToken" }, (response) => {
        console.log('refreshToken response', response);
        if (response.success) {
          this.setupAutoRefresh();
          resolve(true);
        } else {
          // Handle specific errors
          if (response.errorCode === AuthErrorCode.SESSION_EXPIRED || 
              response.errorCode === AuthErrorCode.REFRESH_TOKEN_MISSING ||
              response.errorCode === AuthErrorCode.INVALID_REFRESH_TOKEN) {
            this.handleSessionExpired();
          }
          resolve(false);
        }
      });
    });
  }
  
  /**
   * Get user ID from storage
   */
  public async getUserId(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['userId', 'user'], (result) => {
        const userId = result.userId || (result.user && result.user.id) || null;
        resolve(userId);
      });
    });
  }
  
  /**
   * Get user data from storage
   */
  private async getUserFromStorage(): Promise<AuthUser | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['user'], (result) => {
        resolve(result.user || null);
      });
    });
  }
  
  /**
   * Check if the user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }
  
  /**
   * Get the current auth state
   */
  public getAuthState(): AuthState {
    return { ...this.authState };
  }
  
  /**
   * Subscribe to auth state changes
   */
  public subscribe(callback: (state: AuthState) => void): () => void {
    this.authListeners.add(callback);
    
    // Immediately notify with current state
    callback(this.getAuthState());
    
    // Return unsubscribe function
    return () => {
      this.authListeners.delete(callback);
    };
  }
  
  /**
   * Set up auto token refresh
   */
  private setupAutoRefresh(): void {
    // Clear any existing timer
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    // Get token expiration time
    chrome.storage.local.get(['token_expires_at'], (result) => {
      if (!result.token_expires_at) return;
      
      const expiresAt = result.token_expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      
      // Calculate refresh time (5 minutes before expiration)
      const refreshTime = expiresAt - now - (5 * 60 * 1000);
      
      if (refreshTime <= 0) {
        // Token already expired or about to expire, refresh now
        this.refreshToken();
        return;
      }
      
      // Set timer to refresh token
      this.refreshTimer = window.setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    });
  }
  
  /**
   * Handle session expired errors
   */
  private handleSessionExpired(): void {
    // Update auth state
    this.updateState({
      isAuthenticated: false,
      error: 'Session expired. Please sign in again.',
      user: null
    });
    
    // Clear auth data from storage
    chrome.storage.local.remove(['access_token', 'refresh_token', 'token_expires_at']);
    
    // Show toast notification
    toast.error('Session Expired', {
      description: 'Your session has expired. Please sign in again.',
      action: {
        label: 'Sign In',
        onClick: () => {
          // Trigger sign-in dialog
          document.dispatchEvent(new CustomEvent('archimind:show-auth-modal', {
            detail: { mode: 'signin', isSessionExpired: true }
          }));
        }
      }
    });
    
    // Notify listeners about authentication error
    this.notifyAuthError(AuthErrorCode.SESSION_EXPIRED);
  }
  
  /**
   * Send a custom event for auth errors
   */
  private notifyAuthError(errorCode: AuthErrorCode): void {
    document.dispatchEvent(new CustomEvent('archimind:auth-error', {
      detail: { errorCode }
    }));
  }
  
  /**
   * Update the auth state and notify listeners
   */
  private updateState(partialState: Partial<AuthState>): void {
    this.authState = {
      ...this.authState,
      ...partialState
    };
    
    // Notify all listeners
    this.authListeners.forEach(listener => {
      try {
        listener(this.getAuthState());
      } catch (err) {
        console.error('Error in auth state listener:', err);
      }
    });
  }
  
  /**
   * Sign out the current user
   */
  public async signOut(): Promise<void> {
    // Clear auth data from storage
    chrome.storage.local.remove(['access_token', 'refresh_token', 'token_expires_at', 'user', 'userId'], () => {
      this.updateState({
        isAuthenticated: false,
        user: null,
        error: null
      });
      
      // Clear refresh timer
      if (this.refreshTimer !== null) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }
      
      // Show success toast
      toast.success('Signed Out', {
        description: 'You have been successfully signed out.'
      });
    });
  }
  
  /**
   * Sign in using email/password
   */
  public async signInWithEmail(email: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "emailSignIn", email, password }, (response) => {
        if (response.success) {
          this.updateState({
            isAuthenticated: true,
            user: response.user,
            error: null
          });
          
          // Set up auto token refresh
          this.setupAutoRefresh();
          
          resolve(true);
        } else {
          this.updateState({
            isAuthenticated: false,
            error: response.error || 'Sign-in failed'
          });
          
          resolve(false);
        }
      });
    });
  }
  
  /**
   * Sign up with email/password
   */
  public async signUp(email: string, password: string, name?: string): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "signUp", email, password, name }, (response) => {
        if (response.success) {
          // Don't set as authenticated since email verification may be required
          // We'll just update the user data
          if (response.user) {
            this.updateState({
              user: response.user,
              error: null
            });
          }
          
          resolve(true);
        } else {
          this.updateState({
            isAuthenticated: false,
            error: response.error || 'Sign-up failed'
          });
          
          resolve(false);
        }
      });
    });
  }
  
  /**
   * Clear any error message in the auth state
   */
  public clearError(): void {
    if (this.authState.error) {
      this.updateState({ error: null });
    }
  }
}

// Export a singleton instance
export const authService = AuthService.getInstance();

// Default export for module imports
export default {
  initialize: () => authService.initialize(),
  isAuthenticated: () => authService.isAuthenticated(),
  getAuthState: () => authService.getAuthState(),
  subscribe: (callback: (state: AuthState) => void) => authService.subscribe(callback),
  signOut: () => authService.signOut(),
  signInWithEmail: (email: string, password: string) => authService.signInWithEmail(email, password),
  signUp: (email: string, password: string, name?: string) => authService.signUp(email, password, name),
  refreshToken: () => authService.refreshToken(),
  getUserId: () => authService.getUserId(),
  clearError: () => authService.clearError()
};