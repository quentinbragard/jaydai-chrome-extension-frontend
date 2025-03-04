export interface Template {
  id: string;
  name: string;
  content: string;
  description?: string;
  folder?: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

export interface TemplateFolder {
  path: string;
  name: string;
  templates: Template[];
  subfolders: TemplateFolder[];
}

export interface TemplateCollection {
  templates: Template[];
  folders: TemplateFolder[];
  rootTemplates: Template[];
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