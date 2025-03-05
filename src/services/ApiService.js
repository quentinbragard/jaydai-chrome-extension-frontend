// src/services/ApiService.js
import { getAuthToken, refreshAuthToken } from '../utils/auth.js';

export class ApiService {
  constructor(baseUrl = 'http://127.0.0.1:8000') {
    this.baseUrl = baseUrl;
    this.tokenProvider = getAuthToken;
    this.refreshTokenProvider = refreshAuthToken;
    this.pendingRequests = new Map(); // To deduplicate simultaneous requests
  }
  
  async request(endpoint, options = {}) {
    const requestKey = `${endpoint}-${JSON.stringify(options)}`;
    
    // Check if this exact request is already pending
    if (this.pendingRequests.has(requestKey)) {
      try {
        return await this.pendingRequests.get(requestKey);
      } catch (error) {
        // If the pending request fails, we'll try again
        console.log(`🔄 Previous request failed, retrying: ${endpoint}`);
      }
    }
    
    // Create a new promise for this request
    const requestPromise = this._executeRequest(endpoint, options);
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
  
  async _executeRequest(endpoint, options = {}, retryCount = 0) {
    try {
      // Get auth token
      let token;
      try {
        token = await this.tokenProvider();
      } catch (tokenError) {
        console.warn(`⚠️ Token retrieval failed: ${tokenError.message}`);
        
        // Try using a default or anonymous mode if authentication isn't critical for this endpoint
        if (endpoint.startsWith('/public/') || options.allowAnonymous) {
          console.log(`🔒 Proceeding with anonymous request for ${endpoint}`);
          token = null;
        } else {
          // For most endpoints, auth is required so we'll rethrow
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
      console.log(`🔄 Making request to ${endpoint}`, 
                 { method: fetchOptions.method || 'GET' });
      const response = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);
      
      // Handle unauthorized (token expired)
      if (response.status === 403 || response.status === 401) {
        console.log('🔄 Token expired or unauthorized, refreshing...');
        
        // Only retry once to avoid infinite loops
        if (retryCount < 1) {
          try {
            token = await this.refreshTokenProvider();
            
            // Update authorization header with new token
            const newOptions = {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
              }
            };
            
            // Retry request with new token
            return this._executeRequest(endpoint, newOptions, retryCount + 1);
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
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
      
      // Parse response as JSON, handling errors
      try {
        const data = await response.json();
        return data;
      } catch (jsonError) {
        console.warn(`⚠️ Error parsing JSON response from ${endpoint}:`, jsonError);
        return { success: true, message: 'Request successful but response was not JSON' };
      }
    } catch (error) {
      console.error(`❌ API request failed (${endpoint}):`, error);
      
      // Implement basic retry for network errors
      if (
        (error.message?.includes('network') || error.message?.includes('fetch')) &&
        retryCount < 2 && 
        !options.method || options.method === 'GET'  // Only retry GETs automatically
      ) {
        console.log(`🔄 Network error, retrying (${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this._executeRequest(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }
  }
  
  // All the other methods remain the same
  // User authentication
  async getUserStats() {
    return this.request('/stats/user');
  }
  
  // Templates
  async getUserTemplates() {
    return this.request('/prompt-templates/templates');
  }
  
  async getOfficialTemplates() {
    return this.request('/prompt-templates/official-templates');
  }
  
  async createTemplate(templateData) {
    return this.request('/prompt-templates/template', {
      method: 'POST',
      body: JSON.stringify(templateData)
    });
  }
  
  async updateTemplate(templateId, templateData) {
    return this.request(`/prompt-templates/template/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData)
    });
  }
  
  async deleteTemplate(templateId) {
    return this.request(`/prompt-templates/template/${templateId}`, {
      method: 'DELETE'
    });
  }
  
  async trackTemplateUsage(templateId) {
    return this.request(`/prompt-templates/use-template/${templateId}`, {
      method: 'POST'
    });
  }
  
  // Messages
  async saveChatToBackend(chatData) {
    return this.request('/save/chat', {
      method: 'POST',
      body: JSON.stringify({
        provider_chat_id: chatData.chatId,
        title: chatData.chatTitle,
        provider_name: chatData.providerName
      })
    });
  }
  
  async saveMessageToBackend(messageData) {
    return this.request('/save/message', {
      method: 'POST',
      body: JSON.stringify({
        message_id: messageData.messageId,
        content: messageData.message,
        role: messageData.role,
        rank: messageData.rank,
        provider_chat_id: messageData.providerChatId,
        model: messageData.model || 'unknown',
        thinking_time: messageData.thinkingTime || 0
      })
    });
  }
  
  // Save user metadata
  async saveUserMetadata(userData) {
    console.log("🔄🔄🔄🔄🔄 Saving user metadata:", userData);
    return this.request('/save/user_metadata', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        name: userData.name,
        phone_number: userData.phone_number,
        org_name: userData.org_name
      })
    });
  }
  
  // Notifications
  async fetchNotifications() {
    return this.request('/notifications/');
  }
  
  async fetchUnreadNotifications() {
    return this.request('/notifications/unread');
  }
  
  async getNotificationCounts() {
    return this.request('/notifications/count');
  }
  
  async markNotificationRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'POST'
    });
  }
  
  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'POST'
    });
  }
  
  // Prompt enhancement
  async enhancePrompt(promptData) {
    return this.request('/prompt-generator/enhance', {
      method: 'POST',
      body: JSON.stringify(promptData)
    });
  }
}

// Create singleton instance
export const apiService = new ApiService();