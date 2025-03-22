export interface AuthToken {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }
  
  export interface TokenResponse {
    success: boolean;
    token?: string;
    error?: string;
    errorCode?: string;
  }

/**
 * Authentication session data
 */
export interface AuthSession {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }
  
  /**
   * Authenticated user data
   */
  export interface AuthUser {
    id: string;
    email: string;
    name?: string;
    metadata?: Record<string, any>;
  }
  
  /**
   * Authentication state
   */
  export interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  }
  
  /**
   * Auth error codes
   */
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