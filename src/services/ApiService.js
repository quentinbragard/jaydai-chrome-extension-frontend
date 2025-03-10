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
        console.error('❌ Token error:', tokenError);
        // Try using a default or anonymous mode if authentication isn't critical for this endpoint
        if (endpoint.startsWith('/public/') || options.allowAnonymous) {
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
      
      console.log(`🔄 API Request: ${this.baseUrl}${endpoint}`);
      
      // Make request
      const response = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);
      
      console.log(`📝 API Response status: ${response.status}`);
      
      // Handle unauthorized (token expired)
      if (response.status === 403 || response.status === 401) {
        console.log('🔄 Token expired, attempting to refresh...');
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
        
        console.error(`❌ API error (${response.status}):`, errorData);
        throw new Error(errorData?.detail || `API error: ${response.status}`);
      }
      
      // Parse response as JSON, handling errors
      try {
        const data = await response.json();
        console.log(`✅ API Success:`, {
          endpoint,
          success: data.success,
          dataKeys: Object.keys(data)
        });
        return data;
      } catch (jsonError) {
        console.error('❌ JSON parse error:', jsonError);
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
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this._executeRequest(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }
  }
  
  // User stats
  async getUserStats() {
    return this.request('/stats/user');
  }
  
  // Prompt templates methods
  async getUserTemplates() {
    return this.request('/prompt-templates/user-templates');
  }
  
  async getOfficialTemplates() {
    return this.request('/prompt-templates/official-templates');
  }

  async getAllTemplates() {
    try {
      console.log('🔍 Fetching all templates');
      
      // First try with a direct call to all-templates
      try {
        const response = await this.request('/prompt-templates/all-templates', {
          method: 'GET',
        });
        
        if (response && response.success) {
          console.log('📦 All Templates Response (all-templates):', Object.keys(response));
          // Ensure we have the expected format
          if (response.userTemplates && response.officialTemplates) {
            return response;
          }
        }
      } catch (error) {
        console.log('⚠️ Error with all-templates, will try individual endpoints:', error.message);
      }
      
      // Fallback to fetching user and official templates separately
      console.log('🔄 Falling back to separate template requests');
      
      const [userTemplatesResponse, officialTemplatesResponse] = await Promise.all([
        this.getUserTemplates(),
        this.getOfficialTemplates()
      ]);
      
      // Extract template arrays from each response
      const userTemplates = userTemplatesResponse?.templates || [];
      const officialTemplates = officialTemplatesResponse?.templates || [];
      
      console.log(`📦 Separate templates fetched - User: ${userTemplates.length}, Official: ${officialTemplates.length}`);
      
      return {
        success: true,
        userTemplates: userTemplates,
        officialTemplates: officialTemplates
      };
    } catch (error) {
      console.error('❌ Error fetching all templates:', error);
      
      // Log more detailed error information
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Return empty templates rather than throwing
      return {
        success: false,
        userTemplates: [],
        officialTemplates: [],
        error: error.message
      };
    }
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
  
  async useTemplate(templateId) {
    return this.request(`/prompt-templates/use-template/${templateId}`, {
      method: 'POST'
    });
  }

  // Track template usage
  async trackTemplateUsage(templateId) {
    try {
      return await this.request(`/prompt-templates/use-template/${templateId}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('❌ Error tracking template usage:', error);
      // Don't throw, just return error info
      return { success: false, error: error.message };
    }
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
  
  /// Notifications methods
  async fetchNotifications() {
    return this.request('/notifications/');
  }

  async getNotification(notificationId) {
    try {
      const notifications = await this.fetchNotifications();
      return notifications.find(n => n.id === notificationId);
    } catch (error) {
      console.error('Error fetching specific notification:', error);
      return null;
    }
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

  async getNotificationCounts() {
    return this.request('/notifications/count');
  }
}

// Export a singleton instance
export const apiService = new ApiService();