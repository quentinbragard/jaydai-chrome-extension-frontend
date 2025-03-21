// src/utils/folderUtils.ts
export async function resolveFolderPath(path: string, promptApi: any): Promise<{folder_id?: number, path?: string}> {
  // If no path, template is at root (no folder)
  if (!path || path.trim() === '') {
    return { folder_id: undefined, path: '' };
  }

  try {
    // Get all user folders first
    const userFoldersResponse = await promptApi.getUserFolders();
    if (!userFoldersResponse?.success) {
      console.error('Failed to fetch user folders:', userFoldersResponse?.error);
      return { folder_id: undefined, path: path };
    }

    const userFolders = userFoldersResponse.folders || [];
    
    // Split the path into components
    const pathComponents = path.split('/');
    const rootFolderName = pathComponents[0];
    
    // Try to find the root folder in user's folders
    const existingFolder = userFolders.find(folder => 
      folder.name.toLowerCase() === rootFolderName.toLowerCase()
    );
    
    if (existingFolder) {
      // Use existing folder ID
      return { 
        folder_id: existingFolder.id,
        path: pathComponents.length > 1 ? pathComponents.slice(1).join('/') : ''
      };
    } else {
      // Need to create the folder first
      console.log(`Creating new folder: ${rootFolderName}`);
      
      const newFolderData = {
        name: rootFolderName,
        path: rootFolderName,
        description: `Auto-created for template path: ${path}`
      };
      
      const createFolderResponse = await promptApi.createFolder(newFolderData);
      
      if (createFolderResponse?.success && createFolderResponse?.folder?.id) {
        console.log(`Created new folder with ID: ${createFolderResponse.folder.id}`);
        return {
          folder_id: createFolderResponse.folder.id,
          path: pathComponents.length > 1 ? pathComponents.slice(1).join('/') : ''
        };
      } else {
        console.error('Failed to create folder:', createFolderResponse?.error);
        return { folder_id: undefined, path: path };
      }
    }
  } catch (error) {
    console.error('Error resolving folder path:', error);
    return { folder_id: undefined, path: path };
  }
}