export interface Template {
  id: string;
  title: string;
  content: string;
  description?: string;
  folder?: string;
  category?: string;
  created_at?: string;
  usage_count?: number;
  based_on_official_id?: string | null;
}

export interface TemplateFolder {
  path: string;
  name: string;
  templates: Template[];
  subfolders: TemplateFolder[];
}

export interface TemplateCollection {
  officialTemplates: {
    templates: Template[];
    folders: TemplateFolder[];
  };
  userTemplates: {
    templates: Template[];
    folders: TemplateFolder[];
  };
}

export interface TemplateFormData {
  name: string;
  content: string;
  description: string;
  folder: string;
}

export interface TemplatesPanelProps {
  onClose?: () => void;
  maxHeight?: string;
}