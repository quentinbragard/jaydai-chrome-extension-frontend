// src/services/api/PromptApi.ts - Updated with proper types
import { apiClient } from './ApiClient';
import { 
  Template, 
  TemplateFolder 
} from '@/types/templates';
import { 
  TemplateCreate, 
  TemplateUpdate, 
  TemplateResponse, 
  TemplateUsageResponse,
  FolderCreate,
  FolderResponse,
  FoldersResponse,
  FolderPinResponse
} from '@/types/services/api';

/**
 * API client for working with prompt templates
 */
class PromptApiClient {
  /**
   * Get all template folders of a specific type (for browsing)
   * @param type - Type of folders to fetch (official, organization)
   * @param empty - Whether to return folders without templates
   */
  async getAllTemplateFolders(type: string, empty: boolean = false): Promise<FoldersResponse> {
    try {
      console.log(`Fetching all ${type} folders`);
      
      // Use the same endpoint but without folder_ids to get all folders
      const endpoint = `/prompts/folders?type=${type}&empty=${empty ? 'true' : 'false'}`;
      
      console.log(`Making API request to: ${endpoint}`);
      
      // Use ApiClient to handle auth and error handling
      const response = await apiClient.request<FoldersResponse>(endpoint);
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
  async updatePinnedFolders(type: 'official' | 'organization', folderIds: number[]): Promise<FolderPinResponse> {
    try {
      // Determine which endpoint to use based on folder type
      const endpoint = type === 'official' 
        ? '/prompts/folders/update-pinned' 
        : '/prompts/folders/update-pinned';
      
      // Create payload with the required fields
      const payload = {
        official_folder_ids: type === 'official' ? folderIds : [],
        organization_folder_ids: type === 'organization' ? folderIds : []
      };
      
      console.log(`Updating pinned ${type} folders:`, folderIds);
      
      // Use your existing API endpoint
      const response = await apiClient.request<FolderPinResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return response;
    } catch (error) {
      console.error(`Error updating pinned ${type} folders:`, error);
      return { 
        success: false, 
        pinned_folders: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Toggle pin status for a single folder
   * @param folderId - ID of the folder to toggle
   * @param isPinned - Current pin status (true if pinned, false if not)
   * @param type - Type of folder (official or organization)
   */
  async toggleFolderPin(folderId: number, isPinned: boolean, type: 'official' | 'organization'): Promise<FolderPinResponse> {
    try {
      // Determine which endpoint to use based on current pin status
      const endpoint = isPinned 
        ? `/prompts/folders/unpin/${folderId}` 
        : `/prompts/folders/pin/${folderId}`;
      
      // Add the folder_type as a query parameter instead of a JSON payload
      // This is critical for the backend to properly identify the folder type
      const queryParams = `?folder_type=${type}`;
      
      console.log(`${isPinned ? 'Unpinning' : 'Pinning'} ${type} folder ${folderId}`);
      
      // Make the API request with the query parameter
      const response = await apiClient.request<FolderPinResponse>(`${endpoint}${queryParams}`, {
        method: 'POST'
      });
      
      return response;
    } catch (error) {
      console.error(`Error toggling pin for ${type} folder ${folderId}:`, error);
      return { 
        success: false, 
        pinned_folders: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get template folders by type and optional folder IDs
   */
  async getPromptTemplatesFolders(
    type: string, 
    folderIds: number[] = [], 
    empty: boolean = false
  ): Promise<FoldersResponse> {
    try {
      // Build the endpoint with the proper query parameters
      let endpoint = `/prompts/folders/template-folders?type=${type}`;
      
      // Add folder_ids as a comma-separated string if provided
      if (folderIds && folderIds.length > 0) {
        endpoint += `&folder_ids=${folderIds.join(',')}`;
      }
      
      if (empty) {
        endpoint += '&empty=true';
      }
      
      console.log(`Making API request to: ${endpoint}`);
      
      // Use ApiClient to handle auth and error handling
      const response = await apiClient.request<FoldersResponse>(endpoint);
      
      // Add debug info for troubleshooting
      console.log(`API response for ${type} folders:`, response);
      
      // Ensure every folder has a templates array
      if (response.success && response.folders) {
        response.folders = response.folders.map(folder => {
          // Initialize templates array if not present
          if (!folder.templates) {
            folder.templates = [];
          }
          
          // Ensure Folders array exists
          if (!folder.Folders) {
            folder.Folders = [];
          }
          
          // Process subfolders recursively
          if (folder.Folders.length > 0) {
            folder.Folders = folder.Folders.map(subfolder => {
              if (!subfolder.templates) {
                subfolder.templates = [];
              }
              return subfolder;
            });
          }
          
          return folder;
        });
      }
      
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
  async createTemplate(templateData: TemplateCreate): Promise<TemplateResponse> {
    try {
      // Ensure required fields are present
      if (!templateData.title || !templateData.content) {
        return {
          success: false,
          error: 'Title and content are required'
        };
      }
      
      // Create a proper API request body
      const requestBody: TemplateCreate = {
        title: templateData.title,
        content: templateData.content,
        tags: templateData.tags || [],
        locale: templateData.locale || 'en',
        folder_id: templateData.folder_id || null,
        type: templateData.type || 'user'
      };

      console.log('requestBody', requestBody);
      
      const response = await apiClient.request<TemplateResponse>('/prompts/templates', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      console.log('Template creation response:', response);
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
  async updateTemplate(templateId: number, templateData: TemplateUpdate): Promise<TemplateResponse> {
    try {
      // Ensure required fields are present
      if (!templateData.title && !templateData.content) {
        return {
          success: false,
          error: 'At least one field to update is required'
        };
      }
      
      console.log(`Updating template ${templateId} with data:`, templateData);
      
      const response = await apiClient.request<TemplateResponse>(`/prompts/templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(templateData)
      });
      
      console.log('Template update response:', response);
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
   * Get user folders
   */
  async getUserFolders(): Promise<FoldersResponse> {
    try {
      const response = await apiClient.request<FoldersResponse>('/prompts/folders?type=user', {
        method: 'GET'
      });
      
      console.log('User folders response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching user folders:', error);
      return { 
        success: false, 
        folders: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(folderData: FolderCreate): Promise<FolderResponse> {
    try {
      if (!folderData.name) {
        return {
          success: false,
          error: 'Folder name is required'
        };
      }
      
      console.log('Creating folder with data:', folderData);
      
      const response = await apiClient.request<FolderResponse>('/prompts/folders', {
        method: 'POST',
        body: JSON.stringify(folderData)
      });
      
      console.log('Folder creation response:', response);
      return response;
    } catch (error) {
      console.error('Error creating folder:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a folder
   */
  async deleteFolder(folderId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.request<{ success: boolean }>(`/prompts/folders/${folderId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error deleting folder:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user data from Chrome storage
   */
  async getUserFromStorage(): Promise<any> {
    return new Promise<any>((resolve) => {
      chrome.storage.local.get('user', (result) => {
        resolve(result.user || null);
      });
    });
  }

  /**
   * Update user data in Chrome storage
   */
  async updateUserInStorage(userData: any): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      chrome.storage.local.set({ user: userData }, () => {
        resolve(true);
      });
    });
  }

  /**
   * Track template usage
   * @param templateId - ID of the template being used
   */
  async trackTemplateUsage(templateId: number): Promise<TemplateUsageResponse> {
    try {
      const response = await apiClient.request<TemplateUsageResponse>(`/prompts/templates/use/${templateId}`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error tracking template usage:', error);
      return { 
        success: false, 
        usage_count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user metadata
   */
  async getUserMetadata(): Promise<any> {
    try {
      const response = await apiClient.request<any>('/user/metadata');
      console.log("response", response);
      return response;
    } catch (error) {
      console.error('Error getting user metadata:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export a singleton instance
export const promptApi = new PromptApiClient();