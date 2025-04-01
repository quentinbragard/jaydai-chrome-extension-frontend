// src/hooks/templates/useTemplateFolders.tsx

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { promptApi } from '@/services/api/PromptApi';
import { userApi } from '@/services/api/UserApi';

/**
 * Interface for folder structure
 */
interface TemplateFolder {
  id: number;
  name: string;
  path: string;
  description?: string;
  templates?: any[];
  Folders?: any[];
  is_pinned?: boolean;
  created_at: string;
  type: string;
}

/**
 * Hook for managing template folders
 */
export function useTemplateFolders() {
  const [pinnedOfficialFolders, setPinnedOfficialFolders] = useState<TemplateFolder[]>([]);
  const [pinnedOrganizationFolders, setPinnedOrganizationFolders] = useState<TemplateFolder[]>([]);
  const [userFolders, setUserFolders] = useState<TemplateFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCreatedFolder, setLastCreatedFolder] = useState<TemplateFolder | null>(null);

  // Load all folders (pinned and user)
  const loadFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get user metadata for pinned folder IDs
      const metadataResponse = await userApi.getUserMetadata();
      
      if (!metadataResponse.success) {
        throw new Error(metadataResponse.error || 'Failed to load user metadata');
      }
      
      // Get pinned folder IDs
      const pinnedOfficialIds = metadataResponse.data?.pinned_official_folder_ids || [];
      const pinnedOrganizationIds = metadataResponse.data?.pinned_organization_folder_ids || [];
      
      // Load pinned official folders if any
      let officialFolders: TemplateFolder[] = [];
      if (pinnedOfficialIds.length > 0) {
        const officialResponse = await promptApi.getPromptTemplatesFolders('official', pinnedOfficialIds);
        
        if (officialResponse.success) {
          officialFolders = officialResponse.folders.map(folder => ({
            ...folder,
            is_pinned: true,
            type: 'official'
          }));
        }
      }
      
      // Load pinned organization folders if any
      let organizationFolders: TemplateFolder[] = [];
      if (pinnedOrganizationIds.length > 0) {
        const organizationResponse = await promptApi.getPromptTemplatesFolders('organization', pinnedOrganizationIds);
        
        if (organizationResponse.success) {
          organizationFolders = organizationResponse.folders.map(folder => ({
            ...folder,
            is_pinned: true,
            type: 'organization'
          }));
        }
      }
      
      // Load user folders
      const userResponse = await promptApi.getPromptTemplatesFolders('user');
      
      if (!userResponse.success) {
        throw new Error(userResponse.error || 'Failed to load user folders');
      }
      
      // Make sure each user folder has the type field
      const userFoldersWithType = userResponse.folders.map(folder => ({
        ...folder,
        type: 'user'
      }));
      
      // Update state with loaded folders
      setPinnedOfficialFolders(officialFolders);
      setPinnedOrganizationFolders(organizationFolders);
      setUserFolders(userFoldersWithType);
      
    } catch (err) {
      console.error('Error loading folders:', err);
      setError(err instanceof Error ? err.message : 'An error occurred loading folders');
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load folders on mount
  useEffect(() => {
    loadFolders();
  }, [loadFolders]);
  
  // Toggle a folder's pinned status
  const toggleFolderPin = useCallback(async (folderId: number, isPinned: boolean, type: 'official' | 'organization') => {
    try {
      // Make API call to toggle pin status
      const response = await promptApi.toggleFolderPin(folderId, isPinned, type);
      
      if (response.success === false) {
        throw new Error(response.error || `Failed to ${isPinned ? 'unpin' : 'pin'} folder`);
      }
      
      // Update local state with optimistic update
      if (type === 'official') {
        setPinnedOfficialFolders(prev => {
          if (isPinned) {
            // Unpin folder - remove from list
            return prev.filter(folder => folder.id !== folderId);
          } else {
            // Find folder in the response and add it
            if (response.pinned_folders) {
              // We can't immediately add the folder without full details,
              // so we'll refresh folders to get the complete data
              return prev;
            }
            return prev;
          }
        });
      } else {
        setPinnedOrganizationFolders(prev => {
          if (isPinned) {
            // Unpin folder - remove from list
            return prev.filter(folder => folder.id !== folderId);
          } else {
            // Find folder in the response and add it
            if (response.pinned_folders) {
              // We can't immediately add the folder without full details,
              // so we'll refresh folders to get the complete data
              return prev;
            }
            return prev;
          }
        });
      }
      
      // Refresh folder data to ensure correct state
      await loadFolders();
      
      toast.success(isPinned ? 'Folder unpinned' : 'Folder pinned');
      
      return true;
    } catch (err) {
      console.error('Error toggling folder pin:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update folder');
      return false;
    }
  }, [loadFolders]);
  
  // Create a new folder
  const createFolder = useCallback(async (folderData: { name: string, path?: string, description?: string }) => {
    try {
      // Generate path from name if not provided
      const path = folderData.path || folderData.name.toLowerCase().replace(/\s+/g, '-');
      
      // Make API call to create folder
      const response = await promptApi.createFolder({
        name: folderData.name,
        path,
        description: folderData.description
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create folder');
      }
      
      // Add the type field to the new folder
      const folderWithType = {
        ...response.folder,
        templates: [],
        type: 'user'
      };
      
      // Store the newly created folder for reference
      setLastCreatedFolder(folderWithType);
      
      // Add optimistic update to local state
      setUserFolders(prev => [...prev, folderWithType]);
      
      // Refresh folders to ensure data consistency
      await loadFolders();
      
      toast.success('Folder created successfully');
      
      return folderWithType;
    } catch (err) {
      console.error('Error creating folder:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create folder');
      return null;
    }
  }, [loadFolders]);
  
  // Delete a folder
  const deleteFolder = useCallback(async (folderId: number) => {
    try {
      // Make API call to delete folder
      const response = await promptApi.deleteFolder(folderId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete folder');
      }
      
      // Update local state with optimistic update
      setUserFolders(prev => prev.filter(folder => folder.id !== folderId));
      
      // Refresh folders to ensure data consistency
      await loadFolders();
      
      toast.success('Folder deleted successfully');
      
      return true;
    } catch (err) {
      console.error('Error deleting folder:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete folder');
      return false;
    }
  }, [loadFolders]);

  return {
    // State
    pinnedOfficialFolders,
    pinnedOrganizationFolders,
    userFolders,
    loading,
    error,
    lastCreatedFolder,
    
    // Functions
    loadFolders,
    toggleFolderPin,
    createFolder,
    deleteFolder
  };
}

export default useTemplateFolders;