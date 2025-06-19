// src/types/prompts/folders.ts
import { Template } from './templates';

/**
   * Template folder structure
   */
export interface TemplateFolder {
  id: number;
  /**
   * Localized title coming from the backend.
   * Some legacy code still relies on `name`, so keep both.
   */
  title?: string | Record<string, string>;
  /** @deprecated use `title` */
  name?: string;
  path?: string;
  description?: string | Record<string, string>;
  type: 'company' | 'organization' | 'user';
  templates: Template[];
  Folders?: TemplateFolder[];
  is_pinned?: boolean;
  parent_folder_id?: number | null;
  created_at?: string;
  updated_at?: string;
}
