// src/types/dialog.ts

/**
 * Enum of all dialog types supported by the application
 */
export type DialogType = 
  | 'settings'
  | 'createTemplate'
  | 'editTemplate'
  | 'createFolder'
  | 'placeholderEditor'
  | 'confirmation';

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
  onSave?: () => Promise<void>;
  userFolders?: any[];
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
  onSaveFolder: (folderData: { name: string; path: string; description: string }) => Promise<boolean>;
}