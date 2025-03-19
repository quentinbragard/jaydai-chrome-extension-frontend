// src/services/api/TemplateApi.ts

import { apiClient } from './ApiClient';

export interface Template {
  id: number;
  name: string;
  content: string;
  description?: string;
  folder?: string;
  title: string;
  based_on_official_id?: number | null;
  usage_count?: number;
  locale?: string;
  tags?: string[] | null;
  folder_id?: number;
  type?: string;
}

export interface TemplateFolder {
  id: number;
  name: string;
  description?: string;
  templates: Template[];
  subfolders?: TemplateFolder[];
  is_pinned?: boolean;
}

export interface TemplateResponse {
  success: boolean;
  templates?: Template[];
  error?: string;
}

export interface AllTemplatesResponse {
  success: boolean;
  user_folders: TemplateFolder[];
  official_folders: TemplateFolder[];
  organization_folders: TemplateFolder[];
  error?: string;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
}

export class TemplateApi {
  /**
   * Get all templates
   */
  async getPinnedTemplates(): Promise<AllTemplatesResponse> {
    try {
      const response = await apiClient.request<AllTemplatesResponse>('/prompt-templates/pinned-templates');
      
      if (response && response.success) {
        return response;
      }
      
      // Fallback to separate requests if the combined endpoint fails
      const [userTemplatesResponse, officialTemplatesResponse] = await Promise.all([
        this.getUserTemplates(),
        this.getOfficialTemplates()
      ]);
      
      return {
        success: true,
        user_folders: [{ id: 0, name: 'Root', templates: userTemplatesResponse?.templates || [], subfolders: [] }],
        official_folders: [{ id: 0, name: 'Root', templates: officialTemplatesResponse?.templates || [], subfolders: [] }],
        organization_folders: []
      };
    } catch (error) {
      console.error('Error fetching templates:', error);
      return {
        success: false,
        user_folders: [],
        official_folders: [],
        organization_folders: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get user templates
   */
  async getUserTemplates(): Promise<TemplateResponse> {
    return apiClient.request<TemplateResponse>('/prompt-templates/user-templates');
  }
  
  /**
   * Get official templates
   */
  async getOfficialTemplates(): Promise<TemplateResponse> {
    return apiClient.request<TemplateResponse>('/prompt-templates/official-templates');
  }
  
  /**
   * Create a new template
   */
  async createTemplate(template: Omit<Template, 'id' | 'usage_count'>): Promise<TemplateResponse> {
    return apiClient.request<TemplateResponse>('/prompt-templates/template', {
      method: 'POST',
      body: JSON.stringify(template)
    });
  }
  
  /**
   * Update an existing template
   */
  async updateTemplate(id: number, template: Partial<Template>): Promise<TemplateResponse> {
    return apiClient.request<TemplateResponse>(`/prompt-templates/template/${id}`, {
      method: 'PUT',
      body: JSON.stringify(template)
    });
  }
  
  /**
   * Delete a template
   */
  async deleteTemplate(id: number): Promise<TemplateResponse> {
    return apiClient.request<TemplateResponse>(`/prompt-templates/template/${id}`, {
      method: 'DELETE'
    });
  }

   /**
   * Pin an official folder
   */
   async pinFolder(folderId: number): Promise<ApiResponse> {
    return apiClient.request<ApiResponse>(`/prompt-templates/pin-folder/${folderId}`, {
      method: 'POST'
    });
  }
  
  /**
   * Unpin an official folder
   */
  async unpinFolder(folderId: number): Promise<ApiResponse> {
    return apiClient.request<ApiResponse>(`/prompt-templates/unpin-folder/${folderId}`, {
      method: 'POST'
    });
  }
  
  /**
   * Update pinned folders via user metadata
   */
  async updatePinnedFolders(pinnedOfficialFolderIds: number[], pinnedOrganizationFolderIds: number[]): Promise<ApiResponse> {
    return apiClient.request<ApiResponse>('/save/user_metadata', {
      method: 'POST',
      body: JSON.stringify({
        pinned_official_folder_ids: pinnedOfficialFolderIds,
        pinned_organization_folder_ids: pinnedOrganizationFolderIds
      })
    });
  }
  
}

export const templateApi = new TemplateApi();