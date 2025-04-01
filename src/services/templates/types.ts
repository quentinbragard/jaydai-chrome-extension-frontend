import { Template, TemplateFolder } from '@/types/templates';

export interface TemplateFormData {
  name: string;
  content: string;
  description: string;
  folder: string;
  folder_id: number | null;
  based_on_official_id: number | null;
}

export interface TemplateActions {
  useTemplate: (template: Template) => void;
  editTemplate: (template: Template) => void;
  createTemplate: (selectedFolder?: TemplateFolder) => void;
  finalizeTemplate: (finalContent: string) => void;
}

export interface QueryKeys {
  PINNED_FOLDERS: 'pinnedFolders';
  USER_FOLDERS: 'userFolders';
  ALL_FOLDERS: 'allFolders';
  USER_TEMPLATES: 'userTemplates';
  UNORGANIZED_TEMPLATES: 'unorganizedTemplates';
  USER_METADATA: 'userMetadata';
}

export interface PinnedFoldersResponse {
  official: TemplateFolder[];
  organization: TemplateFolder[];
} 