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

interface OnboardingChecklistData {
  first_template_created: boolean;
  first_template_used: boolean;
  first_block_created: boolean;
  keyboard_shortcut_used: boolean;
  progress: string;
  completed_count: number;
  total_count: number;
  is_complete: boolean;
}

interface OnboardingChecklistUpdate {
  first_template_created?: boolean;
  first_template_used?: boolean;
  first_block_created?: boolean;
  keyboard_shortcut_used?: boolean;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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

/**
 * Get the current onboarding checklist status
 */
async getOnboardingChecklist(): Promise<ApiResponse<OnboardingChecklistData>> {
  try {
    const response = await apiClient.request('/user/onboarding-checklist', {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Error fetching onboarding checklist:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update specific items in the onboarding checklist
 */
async updateOnboardingChecklist(updates: OnboardingChecklistUpdate): Promise<ApiResponse<OnboardingChecklistData>> {
  try {
    const response = await apiClient.request('/user/onboarding-checklist', {
      method: 'POST',
      body: JSON.stringify(updates)
    });
    return response;
  } catch (error) {
    console.error('Error updating onboarding checklist:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Mark a specific onboarding action as complete
 */
async markOnboardingActionComplete(action: keyof OnboardingChecklistUpdate): Promise<ApiResponse<OnboardingChecklistData>> {
  try {
    const response = await apiClient.request(`/user/onboarding-checklist/mark-complete/${action}`, {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error('Error marking onboarding action complete:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Convenience methods for marking specific actions complete
async markFirstTemplateCreated(): Promise<ApiResponse<OnboardingChecklistData>> {
  return this.markOnboardingActionComplete('first_template_created');
}

async markFirstTemplateUsed(): Promise<ApiResponse<OnboardingChecklistData>> {
  return this.markOnboardingActionComplete('first_template_used');
}

async markFirstBlockCreated(): Promise<ApiResponse<OnboardingChecklistData>> {
  return this.markOnboardingActionComplete('first_block_created');
}

async markKeyboardShortcutUsed(): Promise<ApiResponse<OnboardingChecklistData>> {
  return this.markOnboardingActionComplete('keyboard_shortcut_used');
}
}

export const userApi = new UserApi();