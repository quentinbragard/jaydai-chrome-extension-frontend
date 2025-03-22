/**
 * Dialog type identifiers
 */
export type DialogType = 
  | 'auth'
  | 'settings'
  | 'createTemplate'
  | 'editTemplate'
  | 'placeholderEditor'
  | 'createFolder';

/**
 * Options for opening a dialog
 */
export interface DialogOptions {
  initialData?: any;
  onClose?: () => void;
  onConfirm?: (data: any) => void;
}

/**
 * Dialog management context
 */
export interface DialogContext {
  activeDialogs: Set<DialogType>;
  openDialog: (type: DialogType, options?: DialogOptions) => void;
  closeDialog: (type: DialogType) => void;
  getDialogOptions: (type: DialogType) => DialogOptions | undefined;
  isDialogOpen: (type: DialogType) => boolean;
}