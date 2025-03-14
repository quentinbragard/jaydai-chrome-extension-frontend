export interface Template {
    id: string | number;  // Allow either string or number IDs
    name: string;
    title?: string;
    content: string;
    description?: string;
    folder?: string;
    category?: string;
    created_at?: string;
    usage_count?: number;
    based_on_official_id?: string | number | null;
  }
  
  export interface TemplateFolder {
    path: string;
    name: string;
    templates: Template[];
    subfolders: TemplateFolder[];
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
  }
  
  export interface TemplateFormData {
    name: string;
    content: string;
    description: string;
    folder: string;
    based_on_official_id?: number | null;
  }
  
  export interface TemplatesPanelProps {
    onClose?: () => void;
    maxHeight?: string;
  }