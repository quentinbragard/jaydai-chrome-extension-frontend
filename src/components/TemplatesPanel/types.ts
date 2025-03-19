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
}

export interface TemplateFolder {
  id: number;
  name: string;
  description?: string;
  templates: Template[];
  subfolders?: TemplateFolder[];
  is_pinned?: boolean;
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

export interface TemplateFormData {
  name: string;
  content: string;
  description: string;
  folder: string;
  based_on_official_id: number | null;
}

export interface TemplatesPanelProps {
  onClose?: () => void;
  maxHeight?: string;
  onPlaceholderEditorOpenChange?: (isOpen: boolean) => void;
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