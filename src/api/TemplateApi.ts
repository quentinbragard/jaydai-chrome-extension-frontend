// src/services/api/TemplateApi.ts

import { apiClient } from './ApiClient';

export interface Template {
  id?: string | number;
  name: string;
  content: string;
  description?: string;
  folder?: string;
  title?: string;
}

export interface TemplateResponse {
  success: boolean;
  templates?: Template[];
  error?: string;
}

export interface AllTemplatesResponse {
  success: boolean;
  userTemplates: {
    templates: Template[];
  };
  officialTemplates: {
    templates: Template[];
  };
  error?: string;
}

export class TemplateApi {
  /**
   * Get all templates
   */
  async getAllTemplates(): Promise<AllTemplatesResponse> {
    try {
      const response = await apiClient.request<AllTemplatesResponse>('/prompt-templates/all-templates');
      
      if (response && response.success) {
        return response;
      }
      
      // Fallback to separate requests
      const [userTemplatesResponse, officialTemplatesResponse] = await Promise.all([
        this.getUserTemplates(),
        this.getOfficialTemplates()
      ]);
      
      return {
        success: true,
        userTemplates: {
          templates: userTemplatesResponse?.templates || []
        },
        officialTemplates: {
          templates: officialTemplatesResponse?.templates || []
        }
      };
    } catch (error) {
      console.error('Error fetching templates:', error);
      return {
        success: false,
        userTemplates: { templates: [] },
        officialTemplates: { templates: [] },
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
  async createTemplate(template: Template): Promise<TemplateResponse> {
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
   * Track template usage
   */
  async trackTemplateUsage(id: string | number): Promise<TemplateResponse> {
    try {
      return await apiClient.request<TemplateResponse>(`/prompt-templates/use-template/${id}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error tracking template usage:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const templateApi = new TemplateApi();