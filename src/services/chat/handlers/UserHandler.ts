// src/services/chat/handlers/UserHandler.ts
import { apiService } from '@/services/ApiService';
import { UserMetadata } from '../types';

/**
 * Service to handle user metadata from ChatGPT API
 */
export class UserHandler {
  private userInfo: UserMetadata | null = null;
  
  /**
   * Process user information from API
   */
  public processUserInfo(data: any): void {
    try {
      if (!data || !data.id || !data.email) {
        return;
      }
      
      // Extract org name if available
      let orgName = null;
      if (data.orgs && data.orgs.data && data.orgs.data.length > 0) {
        orgName = data.orgs.data[0].title || null;
      }
      
      // Build user metadata
      this.userInfo = {
        id: data.id,
        email: data.email,
        name: data.name || data.email.split('@')[0],
        picture: data.picture || null,
        phone_number: data.phone_number || null,
        org_name: orgName
      };
      
      // Save to backend
      this.saveUserMetadataToBackend();
    } catch (error) {
      console.error('Error processing user info:', error);
    }
  }
  
  /**
   * Get the current user info
   */
  public getUserInfo(): UserMetadata | null {
    return this.userInfo;
  }
  
  /**
   * Save user metadata to backend
   */
  private saveUserMetadataToBackend(): void {
    if (!this.userInfo) return;
    
    apiService.request('/save/user_metadata', {
      method: 'POST',
      body: JSON.stringify(this.userInfo)
    }).catch(error => {
      console.error('Error saving user metadata:', error);
    });
  }
}

// Export a singleton instance
export const userHandler = new UserHandler();