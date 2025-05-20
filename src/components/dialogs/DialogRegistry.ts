// Define dialog types
export const DIALOG_TYPES = {
  // Existing dialog types
  SETTINGS: 'settings',
  CREATE_TEMPLATE: 'createTemplate',
  EDIT_TEMPLATE: 'editTemplate',
  CREATE_FOLDER: 'createFolder',
  PLACEHOLDER_EDITOR: 'placeholderEditor',
  AUTH: 'auth',
  CONFIRMATION: 'confirmation',
  ENHANCED_STATS: 'enhancedStats',
  // New dialog types for blocks
  CREATE_BLOCK: 'createBlock',
  EDIT_BLOCK: 'editBlock',
} as const;

// Export the dialog types
export type DialogType = typeof DIALOG_TYPES[keyof typeof DIALOG_TYPES];

// Define dialog props for each dialog type
export interface DialogProps {
  [DIALOG_TYPES.SETTINGS]: Record<string, never>;
  
  [DIALOG_TYPES.CREATE_TEMPLATE]: {
    formData?: any;
    onFormChange?: (formData: any) => void;
    onSave?: (formData: any) => Promise<boolean>;
    userFolders?: any[];
    selectedFolder?: any;
    availableBlocks?: Record<string, any[]>; // Blocks grouped by type
  };
  
  [DIALOG_TYPES.EDIT_TEMPLATE]: {
    template: any;
    formData?: any;
    onFormChange?: (formData: any) => void;
    onSave?: (formData: any) => Promise<boolean>;
    userFolders?: any[];
    availableBlocks?: Record<string, any[]>; // Blocks grouped by type
  };
  
  [DIALOG_TYPES.CREATE_FOLDER]: {
    onSaveFolder?: (folderData: any) => Promise<any>;
    onFolderCreated?: (folder: any) => void;
  };
  
  [DIALOG_TYPES.AUTH]: {
    initialMode?: 'signin' | 'signup';
    isSessionExpired?: boolean;
    onSuccess?: () => void;
  };
  
  [DIALOG_TYPES.PLACEHOLDER_EDITOR]: {
    content: string;
    title?: string;
    type?: string;
    id?: string | number;
    expandedBlocks?: any[]; // Array of expanded blocks for the template
    onComplete: (content: string, updatedBlocks?: any[]) => void;
  };
  
  [DIALOG_TYPES.CONFIRMATION]: {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  };
  
  [DIALOG_TYPES.ENHANCED_STATS]: Record<string, never>;

  [DIALOG_TYPES.CREATE_BLOCK]: {
    initialData?: any;
    onSave?: (blockData: any) => Promise<boolean>;
    blockTypes?: string[];
  };

  [DIALOG_TYPES.EDIT_BLOCK]: {
    block: any;
    onSave?: (blockData: any) => Promise<boolean>;
    blockTypes?: string[];
  };
}