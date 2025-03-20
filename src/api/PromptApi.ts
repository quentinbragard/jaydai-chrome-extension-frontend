// src/api/PromptApi.ts
import { apiClient } from './ApiClient';
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
      // This works with our modified FastAPI endpoint
      if ((type === 'official' || type === 'organization') && folderIds.length > 0) {
        endpoint += `&folder_ids=${folderIds.join(',')}`;
      }
      
      if (empty) {
        endpoint += '&empty=true';
      }
      
      console.log(`Making API request to: ${endpoint}`);
      
      // Use ApiClient to handle auth and error handling
      const response = await apiClient.request(endpoint);
      console.log(`API response:`, response);
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
}

// Export a singleton instance
export const promptApi = new PromptApiClient();