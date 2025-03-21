// src/components/utils/folderUtils.ts

/**
 * Gets the folder path display name for a folder ID
 * @param folderId The folder ID to find
 * @param userFolders Array of user folders
 * @returns The display path of the folder or null if not found
 */
export function getFolderPathById(folderId: number | undefined, userFolders: any[]): string | null {
    if (!folderId) return null;
    
    // Helper function to find a folder by ID in a nested structure
    const findFolderPath = (folders: any[], targetId: number, currentPath: string = ""): string | null => {
      for (const folder of folders) {
        if (!folder || !folder.id) continue;
        
        // Create the current path
        const folderPath = currentPath ? `${currentPath} / ${folder.name}` : folder.name;
        
        // Check if this is the folder we're looking for
        if (folder.id === targetId) {
          return folderPath;
        }
        
        // Recursively check subfolders if this folder has any
        if (folder.Folders && folder.Folders.length > 0) {
          const foundPath = findFolderPath(folder.Folders, targetId, folderPath);
          if (foundPath) return foundPath;
        }
      }
      
      return null;
    };
    
    return findFolderPath(userFolders, folderId);
  }
  
  /**
   * This function is deprecated and should no longer be used.
   * Instead of resolving paths to folder IDs, use the folder ID directly.
   */
  export async function resolveFolderPath(): Promise<{folder_id?: number, path?: string}> {
    console.warn('resolveFolderPath is deprecated. Use folder IDs directly instead.');
    return { folder_id: undefined, path: '' };
  }