/**
 * Authentication related types
 */

// User model
export interface User {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
    created_at?: string;
    metadata?: Record<string, any>;
  }
  
  // Authentication tokens
  export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }
  
  // Login/signup request
  export interface AuthRequest {
    email: string;
    password: string;
    name?: string;
  }
  
  // Auth result from API
  export interface AuthResult {
    success: boolean;
    user?: User;
    session?: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
    error?: string;
    errorCode?: string;
  }
  
  // OAuth providers supported
  export type OAuthProvider = 'google' | 'github' | 'microsoft';
  
  // Login errors
  export enum AuthErrorCode {
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
    ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
    TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
  }