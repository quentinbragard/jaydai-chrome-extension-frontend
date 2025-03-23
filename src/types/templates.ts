/**
 * Template-related types consolidated in one location
 */

// Base template interface
export interface Template {
    id: number;
    title: string;           // Backend uses 'title', not 'name'
    content: string;
    description?: string;    // Not used in backend but kept for UI
    folder?: string;         // Used for path display
    folder_id?: number;      // Real folder ID in database
    tags?: string[] | null;
    locale?: string;
    type?: string;
    path?: string;
    created_at?: string;
    updated_at?: string;
    last_used_at?: string;   // When the template was last used
    organization_id?: number;
    usage_count?: number;
  }
  
  // Template form data used for creation/editing
  export interface TemplateFormData {
    name: string;            // We keep this as 'name' in form but send as 'title' to API
    content: string;
    description: string;     // Keep for UI even though backend doesn't use it
    folder: string;          // Path representation 
    folder_id?: number;      // Actual folder ID
    based_on_official_id?: number | null; // Not used in current backend but kept for future
  }
  
  // Default form data with the correct structure
  export const DEFAULT_FORM_DATA: TemplateFormData = {
    name: '',
    content: '',
    description: '',
    folder: '',
    folder_id: undefined,
    based_on_official_id: null
  };
  
  // Folder structure for templates
  export interface TemplateFolder {
    id: number;
    name: string;
    description?: string;
    templates: Template[];
    Folders?: TemplateFolder[];
    is_pinned?: boolean;
    path?: string;
    subfolders?: TemplateFolder[];
  }
  
  // View types for templates panel
  export type TemplateViewType = 'templates' | 'browse-official' | 'browse-organization';
  
  // Response types for API calls
  export interface TemplatesResponse {
    success: boolean;
    error?: string;
    templates?: Template[];
  }
  
  export interface TemplateFoldersResponse {
    success: boolean;
    error?: string;
    folders?: TemplateFolder[];
  }
  
  // Folder collection for different template types
  export interface TemplateCollection {
    userTemplates: {
      templates: Template[];
      folders: TemplateFolder[];
    };
    officialTemplates: {
      templates: Template[];
      folders: TemplateFolder[];
    };
    organizationTemplates: {
      templates: Template[];
      folders: TemplateFolder[];
    };
  }
  
  // API response types
  export interface AllTemplatesResponse {
    success: boolean;
    error?: string;
    user_folders: TemplateFolder[];
    official_folders: TemplateFolder[];
    organization_folders: TemplateFolder[];
  }
  
  export interface PinnedTemplatesResponse {
    success: boolean;
    error?: string;
    data: {
      user_folders: TemplateFolder[];
      official_folders: TemplateFolder[];
      organization_folders: TemplateFolder[];
    };
  }
  
  // Placeholder structure for template editing
  export interface Placeholder {
    key: string; 
    value: string;
  }