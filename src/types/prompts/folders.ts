// src/types/prompts/folders.ts
import { Template } from './templates';

/**
   * Template folder structure
   */
export interface TemplateFolder {
  id: number;
  title?: string;
  description?: string;
  type: 'company' | 'organization' | 'user';
  company_id?: number;
  organization_id?: number;
  user_id?: string;
  templates: Template[];
  Folders?: TemplateFolder[];
  is_pinned?: boolean;
  parent_folder_id?: number | null;
  created_at?: string;
  updated_at?: string;
}
