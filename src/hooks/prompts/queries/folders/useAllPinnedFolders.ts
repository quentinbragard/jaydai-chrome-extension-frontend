// src/hooks/prompts/queries/folders/useAllPinnedFolders.ts - Fixed Version
import { useMemo } from 'react';
import { usePinnedFolders } from './usePinnedFolders';
import { useUserFolders, useOrganizationFolders } from './useUserCompanyOrganizationFolders';
import { TemplateFolder } from '@/types/prompts/templates';

/**
 * Hook that returns all pinned folder IDs and a method to find any folder by ID
 * Useful for determining pin status of folders in search results
 */
export function useAllPinnedFolders() {
  const { data: pinnedFolders = [] } = usePinnedFolders();
  console.log('🙏🙏🙏', pinnedFolders);
  const { data: userFolders = [] } = useUserFolders();
  const { data: organizationFolders = [] } = useOrganizationFolders();

  // Get all pinned folder IDs in a flat array - with safety check
  const allPinnedFolderIds = useMemo(() => {
    // Ensure pinnedFolders is an array before mapping
    if (!Array.isArray(pinnedFolders)) {
      console.warn('⚠️ pinnedFolders is not an array:', pinnedFolders);
      return [];
    }
    return pinnedFolders.map(folder => folder.id);
  }, [pinnedFolders]);

  // Enhanced findFolderById with better error handling
  const findFolderById = useMemo(() => {
    const searchInFolders = (folders: TemplateFolder[], targetId: number): TemplateFolder | null => {
      // Safety check for folders array
      if (!Array.isArray(folders)) {
        return null;
      }

      for (const folder of folders) {
        if (!folder) continue; // Skip null/undefined folders
        
        if (folder.id === targetId) {
          return folder;
        }
        if (folder.Folders && Array.isArray(folder.Folders) && folder.Folders.length > 0) {
          const found = searchInFolders(folder.Folders, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    return (folderId: number): TemplateFolder | null => {
      if (!folderId) return null;

      // Search in user folders
      const userResult = searchInFolders(userFolders, folderId);
      if (userResult) return userResult;

      // Search in organization folders
      const orgResult = searchInFolders(organizationFolders, folderId);
      if (orgResult) return orgResult;

      return null;
    };
  }, [userFolders, organizationFolders]);

  // Helper function to check if a folder exists in a tree
  const findInTree = (rootFolder: TemplateFolder, targetId: number): boolean => {
    if (!rootFolder || !rootFolder.id) return false;
    if (rootFolder.id === targetId) return true;
    if (rootFolder.Folders && Array.isArray(rootFolder.Folders)) {
      return rootFolder.Folders.some(subFolder => findInTree(subFolder, targetId));
    }
    return false;
  };

  // Get all pinned folders (including nested ones) as flat array - with safety checks
  const allPinnedFolders = useMemo(() => {
    const folders: Array<TemplateFolder & { folderType: 'user' | 'organization' }> = [];
    
    // Ensure pinnedFolders is an array
    if (!Array.isArray(pinnedFolders)) {
      console.warn('⚠️ pinnedFolders is not an array in allPinnedFolders calculation');
      return folders;
    }
    
    // Add all pinned folders
    pinnedFolders.forEach(folder => {
      if (folder && folder.id) {
        folders.push({ 
          ...folder, 
          folderType: (folder.type as 'user' | 'organization') || 'user'
        });
      }
    });

    // Also check for nested folders that might be pinned
    allPinnedFolderIds.forEach(pinnedId => {
      if (!pinnedId) return;
      
      const folder = findFolderById(pinnedId);
      if (folder) {
        // Check if this folder is already in our list
        const exists = folders.some(f => f.id === folder.id);
        if (!exists) {
          // Determine if it's from user or organization folders
          const isInUserFolders = Array.isArray(userFolders) && 
            userFolders.some(uf => findInTree(uf, folder.id));
          folders.push({ 
            ...folder, 
            folderType: isInUserFolders ? 'user' as const : 'organization' as const 
          });
        }
      }
    });
    return folders;
  }, [pinnedFolders, allPinnedFolderIds, findFolderById, userFolders]);

  console.log('🙏🙏🙏👀🎉✅', allPinnedFolders);
  return {
    allPinnedFolderIds,
    allPinnedFolders,
    findFolderById,
    pinnedFolders: Array.isArray(pinnedFolders) ? pinnedFolders : [] // Ensure we return an array
  };
}