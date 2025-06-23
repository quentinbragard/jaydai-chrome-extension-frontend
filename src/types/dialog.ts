/**
 * Enum of all dialog types supported by the application
 * These must be used consistently across the codebase
 */

import { Template } from './services/api';

// Enum of dialog types (use these constants rather than string literals)
export const DIALOG_TYPES = {
  SETTINGS: 'settings',
  CREATE_TEMPLATE: 'createTemplate',
  EDIT_TEMPLATE: 'editTemplate',
  CREATE_FOLDER: 'createFolder',
  FOLDER_MANAGER: 'folderManager',
  PLACEHOLDER_EDITOR: 'placeholderEditor',
  AUTH: 'auth',
  CONFIRMATION: 'confirmation'
} as const;

export type DialogProps<T extends DialogType = DialogType> = {
  [K in DialogType]: K extends T ? DialogDataMap[K] : never;
}[T];

// Dialog type (string union created from the enum values)
export type DialogType = typeof DIALOG_TYPES[keyof typeof DIALOG_TYPES];

/**
 * Confirmation dialog data interface
 */
export interface ConfirmationDialogData {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * Template dialog data interface
 */
export interface TemplateDialogData {
  template?: any;
  formData?: any;
  onFormChange?: (formData: any) => void;
  onSave?: (formData: any) => Promise<boolean> | boolean;
  userFolders?: any[];
  selectedFolder?: any;
}

/**
 * Auth dialog data interface
 */
export interface AuthDialogData {
  initialMode?: 'signin' | 'signup';
  isSessionExpired?: boolean;
  onSuccess?: () => void;
}

/**
 * Placeholder editor dialog data
 */
export interface PlaceholderEditorData {
  content: string;
  title?: string;
  onComplete: (modifiedContent: string) => void;
  metadata?: any;
  type?: string;
  id?: number;
  organization?: any;
  organization_id?: string;
  image_url?: string;
}

/**
 * Folder dialog data
 */
export interface FolderDialogData {
  onSaveFolder: (folderData: { name: string; path: string; description: string }) => Promise<any>;
  onFolderCreated?: (folder: any) => void;
}

export interface FolderManagerData {
  folder: any;
  userFolders: any[];
  onUpdated?: (folder: any) => void;
}
