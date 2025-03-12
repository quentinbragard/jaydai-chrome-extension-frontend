// src/services/api/UserApi.ts
import { apiClient } from './ApiClient';


export interface UserMetadata {
  email: string;
  name?: string;
  phone_number?: string | null;
  org_name?: string | null;
  picture?: string | null;
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
   * Get user stats
   */
  async getUserStats(): Promise<any> {
    return apiClient.request('/stats/user');
  }
}

export const userApi = new UserApi();