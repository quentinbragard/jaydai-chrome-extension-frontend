// src/services/api/ApiClient.ts
import { AbstractBaseService } from '@/services/BaseService';
import { serviceManager } from '@/core/managers/ServiceManager';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { ENV } from '@/core/env';

import { getCurrentLanguage } from '@/core/utils/i18n';


/**
 * Interface for API responses
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Request options interface
 */
export interface RequestOptions extends RequestInit {
  allowAnonymous?: boolean;
}

/**
 * Base API client with authentication and request handling
 */
export class ApiClient extends AbstractBaseService {
  private static instance: ApiClient;
  private baseUrl: string;
  private pendingRequests: Map<string, Promise<any>> = new Map();
  
  private constructor(baseUrl?: string) {
    super();
    // Use the baseUrl parameter if provided, otherwise fall back to ENV.API_URL
    this.baseUrl = baseUrl || ENV.API_URL;
    
    // Log the API URL when instantiated (helps with debugging)
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(baseUrl?: string): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient(baseUrl);
    } else if (baseUrl && baseUrl !== ApiClient.instance.baseUrl) {
      // If a new baseUrl is provided and it's different from the current one, update it
      ApiClient.instance.setBaseUrl(baseUrl);
    }
    return ApiClient.instance;
  }
  
  /**
   * Initialize the API client
   */
  protected async onInitialize(): Promise<void> {
  }
  
  /**
   * Clean up resources
   */
  protected onCleanup(): void {
    this.pendingRequests.clear();
  }
  
  /**
   * Make an API request with authentication and deduplication
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const requestKey = `${endpoint}-${JSON.stringify(options)}`;
    
    // Check if this exact request is already pending
    if (this.pendingRequests.has(requestKey)) {
      try {
        return await this.pendingRequests.get(requestKey)!;
      } catch (error) {
        // If the pending request fails, we'll try again
      }
    }
    
    // Create a new promise for this request
    const requestPromise = this._executeRequest<T>(endpoint, options);
    this.pendingRequests.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      this.pendingRequests.delete(requestKey);
      return result;
    } catch (error) {
      this.pendingRequests.delete(requestKey);
      throw error;
    }
  }
  
  /**
   * Execute the actual API request
   */
  private async _executeRequest<T>(endpoint: string, options: RequestOptions = {}, retryCount = 0): Promise<T> {
    try {
      // Get auth token service from service manager
      const authService = serviceManager.getService('auth.state');
      let token: string | null = null;
      
      if (!authService) {
        if (endpoint.startsWith('/public/') || options.allowAnonymous) {
          token = null;
        } else {
          throw new Error('Authentication service not available');
        }
      } else {
        try {
          const tokenService = serviceManager.getService('auth.token');
          if (tokenService) {
            const authTokenResponse = await tokenService.getAuthToken();
            if (authTokenResponse.success) {
              token = authTokenResponse.token;
            } else {
              if (endpoint.startsWith('/public/') || options.allowAnonymous) {
                token = null;
              } else {
                throw new Error(authTokenResponse.error || 'Failed to get auth token');
              }
            }
          } else {
            // Use legacy auth service as fallback
            const legacyAuth = serviceManager.getService('auth');
            if (legacyAuth && typeof legacyAuth.getAuthToken === 'function') {
              const authTokenResponse = await legacyAuth.getAuthToken();
              if (authTokenResponse.success) {
                token = authTokenResponse.token;
              } else {
                if (endpoint.startsWith('/public/') || options.allowAnonymous) {
                  token = null;
                } else {
                  throw new Error(authTokenResponse.error || 'Failed to get auth token');
                }
              }
            } else {
              if (endpoint.startsWith('/public/') || options.allowAnonymous) {
                token = null;
              } else {
                throw new Error('No authentication service available');
              }
            }
          }
        } catch (tokenError) {
          if (endpoint.startsWith('/public/') || options.allowAnonymous) {
            token = null;
          } else {
            throw tokenError;
          }
        }
      }
      
      // Set default options
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': getCurrentLanguage(), // ADD THIS LINE
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      };
      
      // Merge options
      const fetchOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers
        }
      };
      
      // Make sure endpoint starts with a slash
      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      // Make request
      const response = await fetch(`${this.baseUrl}${normalizedEndpoint}`, fetchOptions);
      
      // Handle unauthorized (token expired)
      if (response.status === 403 || response.status === 401) {
        if (retryCount < 1) {
          try {
            const tokenService = serviceManager.getService('auth.token');
            if (tokenService && typeof tokenService.refreshToken === 'function') {
              const refreshSuccess = await tokenService.refreshToken();
              
              if (refreshSuccess) {
                const authTokenResponse = await tokenService.getAuthToken();
                token = authTokenResponse.token;
                
                // Update authorization header with new token
                const newOptions = {
                  ...options,
                  headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                  }
                };
                
                // Retry request with new token
                return this._executeRequest<T>(endpoint, newOptions, retryCount + 1);
              } else {
                throw new Error('Token refresh failed');
              }
            } else {
              // Try legacy auth service
              const legacyAuth = serviceManager.getService('auth');
              if (legacyAuth && typeof legacyAuth.refreshToken === 'function') {
                const refreshSuccess = await legacyAuth.refreshToken();
                
                if (refreshSuccess) {
                  const authTokenResponse = await legacyAuth.getAuthToken();
                  token = authTokenResponse.token;
                  
                  // Update authorization header with new token
                  const newOptions = {
                    ...options,
                    headers: {
                      ...options.headers,
                      'Authorization': `Bearer ${token}`
                    }
                  };
                  
                  // Retry request with new token
                  return this._executeRequest<T>(endpoint, newOptions, retryCount + 1);
                } else {
                  throw new Error('Token refresh failed with legacy service');
                }
              } else {
                throw new Error('No authentication service available for token refresh');
              }
            }
          } catch (refreshError) {
            const error = refreshError instanceof Error ? refreshError.message : 'Authentication failed after token refresh attempt';
            throw new Error(error);
          }
        } else {
          throw new Error('Authentication failed after retry');
        }
      }
      
      // Handle error responses
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { detail: errorText };
        }
        
        const errorMessage = errorData?.detail || `API error: ${response.status}`;
        
        throw new Error(errorMessage);
      }
      
      // Parse response as JSON
      try {
        const data = await response.json();
        return data as T;
      } catch (jsonError) {
        return { success: true, message: 'Request successful but response was not JSON' } as unknown as T;
      }
    } catch (error) {
      // Implement basic retry for network errors
      if (
        (error instanceof Error && 
        (error.message?.includes('network') || error.message?.includes('fetch'))) &&
        retryCount < 2 && 
        (!options.method || options.method === 'GET')
      ) {
        const delay = 1000 * (retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._executeRequest<T>(endpoint, options, retryCount + 1);
      }
      
      // Report error
      errorReporter.captureError(
        new AppError(`API request to ${endpoint} failed`, ErrorCode.API_ERROR, error)
      );
      
      throw error;
    }
  }
  
  /**
   * Set base URL
   */
  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
  
  /**
   * Get base URL
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Export a singleton instance
export const apiClient = ApiClient.getInstance();