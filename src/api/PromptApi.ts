// src/api/PromptApi.ts
import { apiClient } from '@/api/ApiClient';
import { Template, TemplateFolder } from '../types';

/**
 * API client for working with prompt templates
 */
class PromptApiClient {
  /**
   * Get prompt template folders by type and optional folder IDs
   * @param type - Type of folders to fetch (official, organization, user)
   * @param folderIds - Optional array of folder IDs to fetch (required for 'official' and 'organization' types)
   * @param empty - Whether to return folders without templates
   */
  async getPromptTemplatesFolders(type: string, folderIds: number[] = [], empty: boolean = false) {
    try {
      // For 'official' and 'organization' types, if no folder IDs are provided, return empty result
      if ((type === 'official' || type === 'organization') && (!folderIds || folderIds.length === 0)) {
        console.log(`No ${type} folder IDs provided, returning empty result`);
        return { success: true, folders: [] };
      }
      
      // Build the endpoint with the proper query parameters
      let endpoint = `/prompt/template-folders?type=${type}`;
      
      // Add folder_ids as a comma-separated string for efficiency
      if ((type === 'official' || type === 'organization') && folderIds.length > 0) {
        endpoint += `&folder_ids=${folderIds.join(',')}`;
      }
      
      if (empty) {
        endpoint += '&empty=true';
      }
      
      console.log(`Making API request to: ${endpoint}`);
      
      // Use ApiClient to handle auth and error handling
      const response = await apiClient.request(endpoint);
      console.log(`API response for getPromptTemplatesFolders:`, response);
      return response;
    } catch (error) {
      console.error('Error fetching template folders:', error);
      
      // Return a safe default value
      return { 
        success: false, 
        folders: [], 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get all template folders of a specific type (for browsing)
   * @param type - Type of folders to fetch (official, organization)
   * @param empty - Whether to return folders without templates
   */
  async getAllTemplateFolders(type: string, empty: boolean = false) {
    try {
      console.log(`Fetching all ${type} folders`);
      
      // Use the same endpoint but without folder_ids to get all folders
      const endpoint = `/prompt/template-folders?type=${type}&empty=${empty ? 'true' : 'false'}`;
      
      console.log(`Making API request to: ${endpoint}`);
      
      // Use ApiClient to handle auth and error handling
      const response = await apiClient.request(endpoint);
      console.log(`API response for getAllTemplateFolders:`, response);
      return response;
    } catch (error) {
      console.error(`Error fetching ${type} folders:`, error);
      
      // Return a safe default value
      return { 
        success: false, 
        folders: [], 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Update a user's pinned folder IDs
   * @param type - Type of folders to update (official or organization)
   * @param folderIds - Array of folder IDs to pin
   */
  async updatePinnedFolders(type: 'official' | 'organization', folderIds: number[]) {
    try {
      // Determine which field to update based on type
      const field = type === 'official' 
        ? 'pinned_official_folder_ids' 
        : 'pinned_organization_folder_ids';
      
      // Get the current user data from storage to include required fields
      const userData = await this.getUserFromStorage();
      if (!userData || !userData.metadata) {
        throw new Error('User data not found in storage');
      }
      
      // Create payload with the required fields
      const payload = {
        email: userData.metadata.additional_email || userData.email || '',
        name: userData.metadata.name || userData.user_metadata?.name || '',
        [field]: folderIds
      };
      
      console.log(`Updating pinned ${type} folders:`, folderIds);
      
      // Use your existing user metadata endpoint
      const response = await apiClient.request('/save/user_metadata', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      // If successful, also update local storage
      if (response.success) {
        // Update the appropriate field in user metadata
        const updatedMetadata = {
          ...userData.metadata,
          [field]: folderIds
        };
        
        // Update the user object with new metadata
        const updatedUser = {
          ...userData,
          metadata: updatedMetadata
        };
        
        // Save back to storage
        await this.updateUserInStorage(updatedUser);
        console.log(`Updated user storage with new ${type} folder IDs:`, folderIds);
      }
      
      return response;
    } catch (error) {
      console.error(`Error updating pinned ${type} folders:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Create a new template
   */
  async createTemplate(templateData: any) {
    try {
      const response = await apiClient.request('/prompt/template', {
        method: 'POST',
        body: JSON.stringify(templateData)
      });
      return response;
    } catch (error) {
      console.error('Error creating template:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Update an existing template
   */
  async updateTemplate(templateId: number, templateData: any) {
    try {
      const response = await apiClient.request(`/prompt/template/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(templateData)
      });
      return response;
    } catch (error) {
      console.error('Error updating template:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Delete a template
   */
  async deleteTemplate(templateId: number) {
    try {
      const response = await apiClient.request(`/prompt/template/${templateId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error deleting template:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user data from Chrome storage
   */
  async getUserFromStorage() {
    return new Promise<any>((resolve) => {
      chrome.storage.local.get('user', (result) => {
        resolve(result.user || null);
      });
    });
  }

  /**
   * Update user data in Chrome storage
   */
  async updateUserInStorage(userData: any) {
    return new Promise<boolean>((resolve) => {
      chrome.storage.local.set({ user: userData }, () => {
        resolve(true);
      });
    });
  }
}

// Export a singleton instance
export const promptApi = new PromptApiClient();