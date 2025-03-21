export interface Template {
  id: number;
  title: string;
  content: string;
  description?: string;
  folder?: string;
  based_on_official_id?: number | null;
  locale?: string;
  tags?: string[] | null;
  folder_id?: number;
  type?: string;
  path?: string;
  created_at?: string;
  updated_at?: string;
  organization_id?: number;
  usage_count?: number;
}

export interface TemplateFormData {
  name: string;
  content: string;
  description: string;
  folder: string;
  folder_id?: number; // Add folder_id field to properly track selected folders
  based_on_official_id: number | null;
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


export interface TemplatesPanelProps {
  onClose?: () => void;
  maxHeight?: string;
  onPlaceholderEditorOpenChange?: (isOpen: boolean) => void;
  goBackToPreviousPanel?: () => void;
}

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