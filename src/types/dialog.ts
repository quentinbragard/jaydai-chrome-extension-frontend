/**
 * Types for the dialog management system
 */

// All supported dialog types in the application
export type DialogType = 
  | 'auth'
  | 'settings'
  | 'createTemplate'
  | 'createFolder'
  | 'placeholderEditor'
  | 'deleteConfirmation'
  | 'notification';

// Common options for all dialogs
export interface DialogBaseOptions {
  onClose?: () => void;
  title?: string;
  description?: string;
}

// Auth dialog specific options
export interface AuthDialogOptions extends DialogBaseOptions {
  initialMode?: 'signin' | 'signup';
  isSessionExpired?: boolean;
}

// Template dialog specific options
export interface TemplateDialogOptions extends DialogBaseOptions {
  templateId?: number;
  folderId?: number;
}

// Delete confirmation dialog options
export interface DeleteConfirmationOptions extends DialogBaseOptions {
  itemType: 'template' | 'folder' | 'notification';
  itemId: number | string;
  itemName?: string;
  onConfirm: () => Promise<void>;
}

// Generic options for any dialog
export type DialogOptions = 
  | DialogBaseOptions 
  | AuthDialogOptions 
  | TemplateDialogOptions
  | DeleteConfirmationOptions;