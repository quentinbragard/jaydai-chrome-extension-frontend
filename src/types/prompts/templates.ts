// src/types/prompts/templates.ts

export interface TemplateMetadata {
  role?: number;
  context?: number;
  goal?: number;
  tone_style?: number;
  output_format?: number;
  audience?: number;
  example?: number[];
  constraint?: number[];
}

export interface Template {
    id: number;
    title: string;
    content: string | Record<string, string>;
    description?: string;
    folder_id?: number | null;
    user_id?: number;
    folder?: string;
    created_at?: string;
    updated_at?: string;
    last_used_at?: string;
    usage_count?: number;
    type?: 'company' | 'organization' | 'user';
    language?: string;
    based_on_company_id?: number | null;
    metadata?: TemplateMetadata;
    is_pinned?: boolean;
  }
  
  /**
   * Template folder interface
   */
export interface TemplateFolder {
  id: number;
  /** Localized title returned by the backend */
  title?: string | Record<string, string>;
  /** @deprecated use `title` */
  name?: string;
  path?: string;
  description?: string | Record<string, string>;
  templates?: Template[];
  Folders?: TemplateFolder[];
  parent_folder_id?: number | null;
  /** @deprecated use `parent_folder_id` */
  parent_id?: number | null;
  type?: 'company' | 'organization' | 'user';
  is_pinned?: boolean;
}
  
  /**
   * Template placeholder for dynamic content
   */
  export interface Placeholder {
    key: string;
    value: string;
  }
  
  /**
   * Default form data for template creation/editing
   */
  export const DEFAULT_FORM_DATA = {
    name: '',
    content: '',
    description: '',
    folder: '',
    folder_id: undefined,
    based_on_company_id: null
  };
  
  /**
   * Dialog types registry - needed for certain Dialog operations
   */
  export const DIALOG_TYPES = {
    CREATE_TEMPLATE: 'createTemplate',
    EDIT_TEMPLATE: 'editTemplate',
    CREATE_FOLDER: 'createFolder',
    FOLDER_MANAGER: 'folderManager',
    SETTINGS: 'settings',
    AUTH: 'auth',
    PLACEHOLDER_EDITOR: 'placeholderEditor',
    CONFIRMATION: 'confirmation'
  };