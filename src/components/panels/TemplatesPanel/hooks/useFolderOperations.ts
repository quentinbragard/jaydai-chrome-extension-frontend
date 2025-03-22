// src/components/panels/TemplatesPanel/hooks/useFolderOperations.ts

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { TemplateFolder } from '@/types/templates';
import { promptApi } from '@/services/api/PromptApi';

interface UseFolderOperationsProps {
  onSuccess?: () => Promise<void> | void;
}

/**
 * Custom hook for folder operations (toggle pin, delete)
 */
export function useFolderOperations({ onSuccess }: UseFolderOperationsProps = {}) {
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});

  /**
   * Toggle folder pin status
   */
  const toggleFolderPin = useCallback(async (
    folderId: number, 
    isPinned: boolean, 
    type: 'official' | 'organization' | 'user'
  ) => {
    const operationKey = `pin-${folderId}`;
    setLoading(prev => ({ ...prev, [operationKey]: true }));
    
    try {
      const response = await promptApi.toggleFolderPin(folderId, isPinned, type);
      
      if (response.success) {
        toast.success(isPinned ? 'Folder unpinned' : 'Folder pinned');
        
        if (onSuccess) {
          await onSuccess();
        }
      } else {
        toast.error(`Failed to ${isPinned ? 'unpin' : 'pin'} folder: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error toggling folder pin:', error);
      toast.error(`Error ${isPinned ? 'unpinning' : 'pinning'} folder`);
    } finally {
      setLoading(prev => ({ ...prev, [operationKey]: false }));
    }
  }, [onSuccess]);

  /**
   * Delete a folder
   */
  const deleteFolder = useCallback(async (folderId: number) => {
    const operationKey = `delete-${folderId}`;
    setLoading(prev => ({ ...prev, [operationKey]: true }));
    
    try {
      const response = await promptApi.deleteFolder(folderId);
      
      if (response.success) {
        toast.success('Folder deleted successfully');
        
        if (onSuccess) {
          await onSuccess();
        }
        
        return true;
      } else {
        toast.error(`Failed to delete folder: ${response.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error(`Error deleting folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setLoading(prev => ({ ...prev, [operationKey]: false }));
    }
  }, [onSuccess]);

  /**
   * Check if an operation is loading
   */
  const isFolderOperationLoading = useCallback((operation: string, folderId: number) => {
    return !!loading[`${operation}-${folderId}`];
  }, [loading]);

  return {
    toggleFolderPin,
    deleteFolder,
    isFolderOperationLoading
  };
}

export default useFolderOperations;