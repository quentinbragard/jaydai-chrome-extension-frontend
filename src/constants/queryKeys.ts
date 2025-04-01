// src/constants/queryKeys.ts
// Centralized query keys for React Query

export const QUERY_KEYS = {
    // Folder-related keys
    FOLDERS: 'folders',
    USER_FOLDERS: 'userFolders',
    PINNED_FOLDERS: 'pinnedFolders',
    ALL_FOLDERS: 'allFolders',
    
    // Template-related keys
    TEMPLATES: 'templates',
    USER_TEMPLATES: 'userTemplates',
    UNORGANIZED_TEMPLATES: 'unorganizedTemplates',
    TEMPLATE_BY_ID: 'templateById',
    
    // User-related keys
    USER: 'user',
    USER_METADATA: 'userMetadata',
  };
  
  // Helper function to create query keys with proper structure
  export const createQueryKey = (base: string, ...parts: any[]): any[] => {
    return [base, ...parts];
  };