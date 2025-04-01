// src/types/templates.ts

/**
 * Template interface representing a prompt template
 */
export interface Template {
    id: number;
    title: string;
    content: string;
    description?: string;
    folder_id?: number | null;
    folder?: string;
    tags?: string[];
    locale?: string;
    type?: 'official' | 'organization' | 'user';
    created_at?: string;
    updated_at?: string;
    last_used_at?: string;
    usage_count?: number;
    organization_id?: number;
  }
  
  /**
   * Template form data for creation/editing
   */
  export interface TemplateFormData {
    name: string;
    content: string;
    description: string;
    folder: string;
    folder_id?: number;
    based_on_official_id?: number | null;
  }
  
  /**
   * Default empty form state
   */
  export const DEFAULT_FORM_DATA: TemplateFormData = {
    name: '',
    content: '',
    description: '',
    folder: '',
    folder_id: undefined,
    based_on_official_id: null
  };
  
  /**
   * Placeholder for template editing
   */
  export interface Placeholder {
    key: string;
    value: string;
  }
  
  /**
   * API response types
   */
  export interface ApiResponse<T = any> {
    success: boolean;
    error?: string;
    data?: T;
  }
  
  export interface TemplatesResponse extends ApiResponse {
    templates?: Template[];
  }
  
  export interface TemplateFoldersResponse extends ApiResponse {
    folders?: TemplateFolder[];
  }
  
  export interface PinnedFoldersResponse extends ApiResponse {
    official?: TemplateFolder[];
    organization?: TemplateFolder[];
  }
  
  /**
   * Convert a backend template to a frontend template
   */
  export function normalizeTemplate(backendTemplate: any): Template {
    return {
      id: backendTemplate.id,
      title: backendTemplate.title || backendTemplate.name || 'Untitled Template',
      content: backendTemplate.content || '',
      description: backendTemplate.description || '',
      folder_id: backendTemplate.folder_id,
      folder: backendTemplate.folder || '',
      tags: backendTemplate.tags || [],
      locale: backendTemplate.locale || 'en',
      type: backendTemplate.type || 'user',
      created_at: backendTemplate.created_at,
      updated_at: backendTemplate.updated_at,
      last_used_at: backendTemplate.last_used_at,
      usage_count: backendTemplate.usage_count || 0
    };
  }
  
  /**
   * Convert a frontend template to backend format
   */
  export function backendTemplate(template: Template | TemplateFormData): any {
    // Handle form data
    if ('name' in template) {
      return {
        title: template.name.trim(),
        content: template.content.trim(),
        description: template.description?.trim(),
        folder_id: template.folder_id,
        tags: []
      };
    }
    
    // Handle template
    return {
      title: template.title?.trim(),
      content: template.content?.trim(),
      description: template.description?.trim(),
      folder_id: template.folder_id,
      tags: template.tags || []
    };
  }