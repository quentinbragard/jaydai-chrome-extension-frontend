import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { TemplateFolder } from '@/types/templates';
import { promptApi } from '@/services/api/PromptApi';

/**
 * Hook for managing template folders
 */
export function useTemplateFolders() {
  const [pinnedOfficialFolders, setPinnedOfficialFolders] = useState<TemplateFolder[]>([]);
  const [pinnedOrganizationFolders, setPinnedOrganizationFolders] = useState<TemplateFolder[]>([]);
  const [userFolders, setUserFolders] = useState<TemplateFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all folders
  const loadFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading folders...');
      
      // Fetch user's metadata to get pinned folder IDs
      const userMetadataResponse = await promptApi.getUserMetadata();
      
      if (!userMetadataResponse.success) {
        throw new Error(userMetadataResponse.error || 'Failed to load user metadata');
      }
      
      const metadata = userMetadataResponse.data;
      
      // Get pinned official folders
      const officialFolderIds = metadata?.pinned_official_folder_ids || [];
      let officialFolders: TemplateFolder[] = [];
      
      if (officialFolderIds.length > 0) {
        const officialResponse = await promptApi.getPromptTemplatesFolders('official', officialFolderIds);
        if (officialResponse.success) {
          officialFolders = officialResponse.folders || [];
        } else {
          console.warn('Failed to load official folders:', officialResponse.error);
        }
      }
      
      // Get pinned organization folders
      const orgFolderIds = metadata?.pinned_organization_folder_ids || [];
      let orgFolders: TemplateFolder[] = [];
      
      if (orgFolderIds.length > 0) {
        const orgResponse = await promptApi.getPromptTemplatesFolders('organization', orgFolderIds);
        if (orgResponse.success) {
          orgFolders = orgResponse.folders || [];
        } else {
          console.warn('Failed to load organization folders:', orgResponse.error);
        }
      }
      
      // Get user folders
      const userResponse = await promptApi.getPromptTemplatesFolders('user');
      const userFolders = userResponse.success ? userResponse.folders || [] : [];
      
      if (!userResponse.success) {
        console.warn('Failed to load user folders:', userResponse.error);
      }
      
      // Update state
      setPinnedOfficialFolders(officialFolders);
      setPinnedOrganizationFolders(orgFolders);
      setUserFolders(userFolders);
      
      console.log('Folders loaded:', {
        officialFolders,
        orgFolders,
        userFolders
      });
      
    } catch (error) {
      console.error('Error loading folders:', error);
      setError(error instanceof Error ? error.message : 'Failed to load folders');
      // Set empty arrays to prevent UI from showing loading indefinitely
      setPinnedOfficialFolders([]);
      setPinnedOrganizationFolders([]);
      setUserFolders([]);
      
      if (error instanceof Error) {
        toast.error(`Failed to load folders: ${error.message}`);
      } else {
        toast.error('Failed to load folders');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new folder
  const createFolder = async (folderData: { name: string, path: string, description?: string }) => {
    try {
      const response = await promptApi.createFolder(folderData);
      
      if (response.success) {
        toast.success('Folder created');
        
        // Refresh folders to update the UI
        await loadFolders();
        
        return true;
      } else {
        toast.error(`Failed to create folder: ${response.error}`);
        return false;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create folder');
      return false;
    }
  };

  // Delete a folder
  const deleteFolder = async (folderId: number) => {
    if (!window.confirm('Delete this folder and all templates inside?')) return false;
    
    try {
      const response = await promptApi.deleteFolder(folderId);
      
      if (response.success) {
        toast.success('Folder deleted');
        
        // Refresh folders to update the UI
        await loadFolders();
        return true;
      } else {
        toast.error(`Failed to delete folder: ${response.error}`);
        return false;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete folder');
      return false;
    }
  };

  // Toggle pinning a folder
  const toggleFolderPin = async (folderId: number, isPinned: boolean, type: 'official' | 'organization') => {
    try {
      const response = await promptApi.toggleFolderPin(folderId, isPinned, type);
      
      if (response && response.success) {
        toast.success(isPinned ? 'Folder unpinned' : 'Folder pinned');
        
        // Refresh folders to update the UI
        await loadFolders();
        return true;
      } else {
        const errorMsg = response?.error || 'Unknown error';
        toast.error(`Failed to ${isPinned ? 'unpin' : 'pin'} folder: ${errorMsg}`);
        return false;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update folder pin status');
      return false;
    }
  };

  // Load folders on init
  useEffect(() => {
    loadFolders().catch(err => {
      console.error('Initial folder loading failed:', err);
      setLoading(false); // Ensure loading is set to false even if error occurs
    });
  }, [loadFolders]);

  return {
    pinnedOfficialFolders,
    pinnedOrganizationFolders,
    userFolders,
    loading,
    error,
    loadFolders,
    createFolder,
    deleteFolder,
    toggleFolderPin
  };
}

export default useTemplateFolders;