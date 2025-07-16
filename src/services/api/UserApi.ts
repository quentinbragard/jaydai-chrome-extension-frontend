// src/services/api/UserApi.ts
import { apiClient } from './ApiClient';

export interface UserMetadata {
  email?: string;
  name?: string;
  phone_number?: string | null;
  org_name?: string | null;
  picture?: string | null;
  additional_emails?: string[];
  additional_organizations?: string[];
  pinned_folder_ids?: number[];
  pinned_template_ids?: number[];
  preferences_metadata?: Record<string, any>;
  data_collection?: boolean;
}

export interface DataCollectionRequest {
  data_collection: boolean;
}

export class UserApi {
  /**
   * Save user metadata
   */
  async saveUserMetadata(userData: UserMetadata): Promise<any> {
    return apiClient.request('/save/user_metadata', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Get user metadata
   */
  async getUserMetadata(): Promise<any> {
    return apiClient.request('/user/metadata');
  }

  /**
   * Update user's data collection preference
   */
  async updateDataCollection(enabled: boolean): Promise<any> {
    return apiClient.request('/user/data-collection', {
      method: 'PUT',
      body: JSON.stringify({ data_collection: enabled })
    });
  }
  
  /**
   * Get user stats
   */
  async getUserStats(): Promise<any> {
    return apiClient.request('/stats/user');
  }

  /**
   * Get weekly conversation statistics
   */
  async getWeeklyConversationStats(): Promise<any> {
    return apiClient.request('/stats/conversations/weekly');
  }

  /**
   * Get message distribution statistics
   */
  async getMessageDistribution(): Promise<any> {
    return apiClient.request('/stats/messages/distribution');
  }

  /**
   * Get user onboarding status
   */
  async getUserOnboardingStatus(): Promise<any> {
    return apiClient.request('/user/onboarding/status');
  }
}

export const userApi = new UserApi();