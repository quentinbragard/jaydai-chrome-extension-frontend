// src/core/dialogs/registry.ts

/**
 * Registry of all dialog types in the application
 */
export const DIALOG_TYPES = {
  SETTINGS: 'settings',
  CREATE_TEMPLATE: 'createTemplate',
  EDIT_TEMPLATE: 'editTemplate',
  CREATE_FOLDER: 'createFolder',
  AUTH: 'auth',
  PLACEHOLDER_EDITOR: 'placeholderEditor',
  CONFIRMATION: 'confirmation',
} as const;

export type DialogType = typeof DIALOG_TYPES[keyof typeof DIALOG_TYPES];

// Template dialog props
export interface TemplateDialogProps {
  template?: any;
  formData?: any;
  onFormChange?: (formData: any) => void;
  onSave?: () => Promise<boolean>;
  userFolders?: any[];
}

// Folder dialog props
export interface FolderDialogProps {
  onSaveFolder: (folderData: { 
    name: string; 
    path: string; 
    description: string 
  }) => Promise<boolean>;
}

// Placeholder editor props
export interface PlaceholderEditorProps {
  content: string;
  title?: string;
  onComplete: (modifiedContent: string) => void;
}

// Confirmation dialog props
export interface ConfirmationDialogProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

// Auth dialog props
export interface AuthDialogProps {
  initialMode?: 'signin' | 'signup';
  isSessionExpired?: boolean;
  onSuccess?: () => void;
}

// Define all dialog props by type
export interface DialogProps {
  [DIALOG_TYPES.SETTINGS]: Record<string, never>;
  [DIALOG_TYPES.CREATE_TEMPLATE]: TemplateDialogProps;
  [DIALOG_TYPES.EDIT_TEMPLATE]: TemplateDialogProps;
  [DIALOG_TYPES.CREATE_FOLDER]: FolderDialogProps;
  [DIALOG_TYPES.AUTH]: AuthDialogProps;
  [DIALOG_TYPES.PLACEHOLDER_EDITOR]: PlaceholderEditorProps;
  [DIALOG_TYPES.CONFIRMATION]: ConfirmationDialogProps;
}