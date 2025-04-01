// src/types/prompts/templates.ts
/**
 * Types for templates, folders, and related data structures
 */

export interface Placeholder {
    key: string;
    value: string;
    description?: string;
    options?: string[];
  }
  
  export interface Template {
    id: number;
    title: string;
    content: string;
    description?: string;
    folder_id: number | null;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
    last_used_at?: string;
    usage_count?: number;
    locale?: string;
    tags?: string[];
    type?: 'official' | 'organization' | 'user';
    is_published?: boolean;
    
    // Extended properties used in UI
    displayTitle?: string;
    isPopular?: boolean;
    formattedLastUsed?: string;
  }
  
  export interface TemplateFolder {
    id: number;
    name: string;
    path?: string;
    description?: string;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
    parent_id?: number | null;
    type?: 'official' | 'organization' | 'user';
    is_published?: boolean;
    locale?: string;
    is_pinned?: boolean;
    templates?: Template[];
    Folders?: TemplateFolder[];
  }
  
  export interface TemplateFolderGroup {
    official: TemplateFolder[];
    organization: TemplateFolder[];
    user: TemplateFolder[];
  }
  
  export interface TemplateFormData {
    name: string;
    content: string;
    description?: string;
    folder_id?: number | null;
    tags?: string[];
    locale?: string;
  }
  
  export interface TemplateValidationErrors {
    name?: string;
    content?: string;
    description?: string;
  }
  
  export interface FolderFormData {
    name: string;
    path: string;
    description?: string;
    parent_id?: number | null;
  }
  
  export interface FolderValidationErrors {
    name?: string;
    path?: string;
  }
  
  export interface UserTemplateMetadata {
    pinned_official_folder_ids: number[];
    pinned_organization_folder_ids: number[];
    recent_template_ids: number[];
    favorite_template_ids: number[];
  }

  /**
 * Default template form data structure for new templates
 */
export const DEFAULT_FORM_DATA = {
    // Basic template information
    name: '',            // Template title/name
    content: '',         // Template content/prompt text
    description: '',     // Optional description
    
    // Folder information
    folder_id: null,     // ID of the folder this template belongs to (null for unorganized)
    
    // Additional metadata (optional fields)
    tags: [],            // Array of tags for categorization
    locale: navigator.language || 'en', // Default to browser language or English
    
    // For template cloning/forking features
    based_on_id: null    // If this template is based on another one (null for originals)
  };