// src/services/api/TemplateApi.ts

import { apiClient } from './ApiClient';

export interface Template {
  id?: string | number;
  name: string;
  content: string;
  description?: string;
  folder?: string;
  title?: string;
  based_on_official_id?: number | null;
  usage_count?: number;
}

export interface TemplateResponse {
  success: boolean;
  templates?: Template[];
  error?: string;
}

export interface AllTemplatesResponse {
  success: boolean;
  userTemplates: Template[];
  officialTemplates: Template[];
  error?: string;
}

export class TemplateApi {
  /**
   * Get all templates
   */
  async getAllTemplates(): Promise<AllTemplatesResponse> {
    try {
      const response = await apiClient.request<{
        success: boolean;
        userTemplates: Template[];
        officialTemplates: Template[];
      }>('/prompt-templates/all-templates');
      
      if (response && response.success) {
        return {
          success: true,
          userTemplates: response.userTemplates || [],
          officialTemplates: response.officialTemplates || []
        };
      }
      
      // Fallback to separate requests if the combined endpoint fails
      const [userTemplatesResponse, officialTemplatesResponse] = await Promise.all([
        this.getUserTemplates(),
        this.getOfficialTemplates()
      ]);
      
      return {
        success: true,
        userTemplates: userTemplatesResponse?.templates || [],
        officialTemplates: officialTemplatesResponse?.templates || []
      };
    } catch (error) {
      console.error('Error fetching templates:', error);
      return {
        success: false,
        userTemplates: [],
        officialTemplates: [],
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
  async updateTemplate(id: string | number, template: Partial<Template>): Promise<TemplateResponse> {
    return apiClient.request<TemplateResponse>(`/prompt-templates/template/${id}`, {
      method: 'PUT',
      body: JSON.stringify(template)
    });
  }
  
  /**
   * Delete a template
   */
  async deleteTemplate(id: string | number): Promise<TemplateResponse> {
    return apiClient.request<TemplateResponse>(`/prompt-templates/template/${id}`, {
      method: 'DELETE'
    });
  }

    /**
   * Pin an official folder
   */
    async pinFolder(folderId: number): Promise<any> {
      return apiClient.request(`/prompt-templates/pin-folder/${folderId}`, {
        method: 'POST'
      });
    }
    
    /**
     * Unpin an official folder
     */
    async unpinFolder(folderId: number): Promise<any> {
      return apiClient.request(`/prompt-templates/unpin-folder/${folderId}`, {
        method: 'POST'
      });
    }
  
}

export const templateApi = new TemplateApi();