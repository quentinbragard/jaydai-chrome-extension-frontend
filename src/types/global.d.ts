/**
 * Global Type Definitions
 */

import { DialogType } from './dialog';

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    // Dialog manager for opening/closing dialogs
    dialogManager: {
      openDialog: <T extends DialogType>(type: T, data?: any) => void;
      closeDialog: (type: DialogType) => void;
    };
    
    // File system for reading files (used in artifacts)
    fs: {
      readFile: (path: string, options?: { encoding?: string }) => Promise<Uint8Array | string>;
    };
    
    // Any chrome extension APIs we need to access
    chrome?: {
      runtime: {
        sendMessage: (message: any, callback?: (response: any) => void) => void;
        lastError?: Error;
      };
      storage: {
        local: {
          get: (keys: string | string[] | object, callback: (result: any) => void) => void;
          set: (items: object, callback?: () => void) => void;
          remove: (keys: string | string[], callback?: () => void) => void;
        };
        sync: {
          get: (keys: string | string[] | object, callback: (result: any) => void) => void;
          set: (items: object, callback?: () => void) => void;
          remove: (keys: string | string[], callback?: () => void) => void;
        };
      };
      tabs?: {
        query: (
          queryInfo: { active: boolean; currentWindow: boolean },
          callback: (tabs: { id: number }[]) => void
        ) => void;
        sendMessage: (tabId: number, message: any) => void;
      };
      i18n?: {
        getUILanguage: () => string;
      };
    };
    
    // Any other global properties your extension uses
    ENV?: {
      NODE_ENV: 'development' | 'production';
      API_URL: string;
      DEBUG: boolean;
    };
  }
}

// Need this empty export to make this file a module
export {};