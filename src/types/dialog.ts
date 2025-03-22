/**
 * Types for the dialog management system
 */

// All supported dialog types in the application
export type DialogType = 
  | 'auth'
  | 'settings'
  | 'createTemplate'
  | 'editTemplate'
  | 'createFolder'
  | 'confirmation';

/**
 * Options that can be passed to a dialog
 */
export interface DialogOptions {
  title?: string;
  description?: string;
  // Auth-specific options
  initialMode?: 'signin' | 'signup';
  isSessionExpired?: boolean;
  // Template-specific options
  templateId?: string | number;
  folderId?: string | number;
  // Generic options
  entity?: any;
  data?: any;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

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
