// src/core/dialogs/registry.ts

/**
 * Registry of dialog types for the application
 * Used to reference dialogs consistently throughout the app
 */
export enum DIALOG_TYPES {
  CREATE_TEMPLATE = 'createTemplate',
  EDIT_TEMPLATE = 'editTemplate',
  CREATE_FOLDER = 'createFolder',
  SETTINGS = 'settings',
  AUTH = 'auth',
  PLACEHOLDER_EDITOR = 'placeholderEditor',
  CONFIRMATION = 'confirmation'
}

/**
 * Type for dialog types
 */
export type DialogType = keyof typeof DIALOG_TYPES;

/**
 * Props for each dialog type
 */
export interface DialogProps {
  [DIALOG_TYPES.CREATE_TEMPLATE]: {
    formData?: any;
    userFolders?: any[];
    selectedFolder?: any;
    onFormChange?: (formData: any) => void;
    onSave?: (formData: any) => Promise<boolean>;
  };
  
  [DIALOG_TYPES.EDIT_TEMPLATE]: {
    template: any;
    formData?: any;
    userFolders?: any[];
    onFormChange?: (formData: any) => void;
    onSave?: (formData: any) => Promise<boolean>;
  };
  
  [DIALOG_TYPES.CREATE_FOLDER]: {
    onSaveFolder?: (folderData: any) => Promise<any>;
    onFolderCreated?: (folder: any) => void;
  };
  
  [DIALOG_TYPES.SETTINGS]: {};
  
  [DIALOG_TYPES.AUTH]: {
    initialMode?: 'signin' | 'signup';
    isSessionExpired?: boolean;
    onSuccess?: () => void;
  };
  
  [DIALOG_TYPES.PLACEHOLDER_EDITOR]: {
    title?: string;
    content: string;
    onComplete: (content: string) => void;
  };
  
  [DIALOG_TYPES.CONFIRMATION]: {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  };
}