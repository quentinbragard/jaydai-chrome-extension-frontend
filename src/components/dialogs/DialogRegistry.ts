// src/components/dialogs/DialogRegistry.ts
// Define dialog types
export const DIALOG_TYPES = {
  // Existing dialog types
  SETTINGS: 'settings',
  CREATE_TEMPLATE: 'createTemplate',
  EDIT_TEMPLATE: 'editTemplate',
  CREATE_FOLDER: 'createFolder',
  FOLDER_MANAGER: 'folderManager',
  PLACEHOLDER_EDITOR: 'templateDialog',
  AUTH: 'auth',
  CONFIRMATION: 'confirmation',
  ENHANCED_STATS: 'enhancedStats',

  // Dialog for browsing all folders
  BROWSE_MORE_FOLDERS: 'browseMoreFolders',

  // New dialog type for block creation
  CREATE_BLOCK: 'createBlock',
  INSERT_BLOCK: 'insertBlock',
  TUTORIALS_LIST: 'tutorialsList',
  TUTORIAL_VIDEO: 'tutorialVideo',

  // New dialog type for subscription management
  MANAGE_SUBSCRIPTION: 'manageSubscription',

  // Dialog shown when a paid subscription is required
  PAYWALL: 'paywall'
  ,
  // Dialog for onboarding keyboard shortcuts
  KEYBOARD_SHORTCUT: 'keyboardShortcut',
  INFORMATION: 'information',
  // Dialog for sharing the extension
  SHARE: 'share'

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
  };
  
  [DIALOG_TYPES.EDIT_TEMPLATE]: {
    template: any;
    formData?: any;
    onFormChange?: (formData: any) => void;
    onSave?: (formData: any) => Promise<boolean>;
    userFolders?: any[];
  };
  
  [DIALOG_TYPES.CREATE_FOLDER]: {
    onSaveFolder?: (folderData: any) => Promise<any>;
    onFolderCreated?: (folder: any) => void;
  };

  [DIALOG_TYPES.FOLDER_MANAGER]: {
    folder: any;
    userFolders: any[];
    onUpdated?: (folder: any) => void;
  };
  
  [DIALOG_TYPES.AUTH]: {
    initialMode?: 'signin' | 'signup';
    isSessionExpired?: boolean;
    onSuccess?: () => void;
  };
  
  [DIALOG_TYPES.PLACEHOLDER_EDITOR]: {
    content: string;
    title?: string;
    onComplete: (content: string) => void;
    metadata?: any;
    type?: string;
    id?: number;
    organization?: any;
    organization_id?: string;
    image_url?: string;
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

  [DIALOG_TYPES.BROWSE_MORE_FOLDERS]: Record<string, never>;
  
  [DIALOG_TYPES.CREATE_BLOCK]: {
    initialType?: string;
    initialContent?: string;
    onBlockCreated?: (block: any) => void;
  };

  [DIALOG_TYPES.INSERT_BLOCK]: Record<string, never>;

  [DIALOG_TYPES.TUTORIALS_LIST]: Record<string, never>;

  [DIALOG_TYPES.TUTORIAL_VIDEO]: {
    url?: string;
    title?: string;
  };

  [DIALOG_TYPES.MANAGE_SUBSCRIPTION]: Record<string, never>;

  [DIALOG_TYPES.PAYWALL]: Record<string, never>;

  [DIALOG_TYPES.KEYBOARD_SHORTCUT]: {
    onShortcutUsed?: () => void;
  };

  [DIALOG_TYPES.INFORMATION]: {
    title?: string;
    description?: string;
    gifUrl?: string;
    actionText?: string;
    onAction?: () => void;
  };
  [DIALOG_TYPES.SHARE]: Record<string, never>;
}

