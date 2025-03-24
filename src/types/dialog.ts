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
  PLACEHOLDER_EDITOR: 'placeholderEditor',
  AUTH: 'auth',
  CONFIRMATION: 'confirmation'
} as const;

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
}

/**
 * Folder dialog data
 */
export interface FolderDialogData {
  onSaveFolder: (folderData: { name: string; path: string; description: string }) => Promise<any>;
  onFolderCreated?: (folder: any) => void;
}

/**
 * Dialog props mapping type
 * Maps each dialog type to its corresponding data interface
 */
export interface DialogProps {
  [DIALOG_TYPES.SETTINGS]: Record<string, never>;
  [DIALOG_TYPES.CREATE_TEMPLATE]: TemplateDialogData;
  [DIALOG_TYPES.EDIT_TEMPLATE]: TemplateDialogData;
  [DIALOG_TYPES.CREATE_FOLDER]: FolderDialogData;
  [DIALOG_TYPES.PLACEHOLDER_EDITOR]: PlaceholderEditorData;
  [DIALOG_TYPES.AUTH]: AuthDialogData;
  [DIALOG_TYPES.CONFIRMATION]: ConfirmationDialogData;
}