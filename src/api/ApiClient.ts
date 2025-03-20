// src/services/api/ApiClient.ts

import { authService } from '@/services/auth/AuthService';

/**
 * Base API client with authentication and request handling
 */
export class ApiClient {
  private baseUrl: string;
  private pendingRequests: Map<string, Promise<any>>;
  
  constructor(baseUrl = 'http://127.0.0.1:8000') {
    this.baseUrl = baseUrl;
    this.pendingRequests = new Map();
  }
  
  /**
   * Make an API request with authentication and deduplication
   */
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
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
      // Get auth token
      let token;
      try {
        const authTokenResponse = await authService.getAuthToken();
        if (authTokenResponse.success) {
          token = authTokenResponse.token;
        } else {
          throw new Error('Failed to get auth token');
        }
        console.log('token', token);
      } catch (tokenError) {
        if (endpoint.startsWith('/public/') || options.allowAnonymous) {
          token = null;
        } else {
          throw tokenError;
        }
      }
      
      // Set default options
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
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
      
      // Make request
      const response = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);
      
      // Handle unauthorized (token expired)
      if (response.status === 403 || response.status === 401) {
        if (retryCount < 1) {
          try {
            token = await authService.refreshToken();
            
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
          } catch (refreshError) {
            throw new Error('Authentication failed after token refresh attempt');
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
        
        throw new Error(errorData?.detail || `API error: ${response.status}`);
      }
      
      // Parse response as JSON
      try {
        return await response.json();
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
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return this._executeRequest<T>(endpoint, options, retryCount + 1);
    }
    
    throw error;
  }
}
}

/**
* Request options interface
*/
export interface RequestOptions extends RequestInit {
allowAnonymous?: boolean;
}

// Export a singleton instance
export const apiClient = new ApiClient();