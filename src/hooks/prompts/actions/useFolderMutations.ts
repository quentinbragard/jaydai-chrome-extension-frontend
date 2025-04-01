// src/hooks/prompts/actions/useFolderMutations.ts
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'sonner';
import { promptApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys'; // Updated import

interface FolderData {
  name: string;
  path: string;
  description?: string;
}

interface TogglePinParams {
  folderId: number;
  isPinned: boolean;
  type: 'official' | 'organization';
}

/**
 * Hook that provides mutations for folder CRUD operations
 */
export function useFolderMutations() {
  const queryClient = useQueryClient();
  
  // Invalidate relevant queries after folder operations
  const invalidateFolderQueries = () => {
    queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
    queryClient.invalidateQueries(QUERY_KEYS.ALL_FOLDERS);
  };
  
  // Create folder mutation
  const createFolder = useMutation(
    async (data: FolderData) => {
      const response = await promptApi.createFolder(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create folder');
      }
      return response.folder;
    },
    {
      onSuccess: () => {
        invalidateFolderQueries();
        toast.success('Folder created successfully');
      },
      onError: (error: Error) => {
        console.error('Error creating folder:', error);
        toast.error(`Failed to create folder: ${error.message}`);
      }
    }
  );
  
  // Update folder mutation
  const updateFolder = useMutation(
    async ({ id, data }: { id: number; data: Partial<FolderData> }) => {
      const response = await promptApi.updateFolder(id, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update folder');
      }
      return response.folder;
    },
    {
      onSuccess: () => {
        invalidateFolderQueries();
        toast.success('Folder updated successfully');
      },
      onError: (error: Error) => {
        console.error('Error updating folder:', error);
        toast.error(`Failed to update folder: ${error.message}`);
      }
    }
  );
  
  // Delete folder mutation
  const deleteFolder = useMutation(
    async (id: number) => {
      const response = await promptApi.deleteFolder(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete folder');
      }
      return id;
    },
    {
      onSuccess: () => {
        invalidateFolderQueries();
        // Also invalidate template queries since templates may be orphaned
        queryClient.invalidateQueries(QUERY_KEYS.USER_TEMPLATES);
        queryClient.invalidateQueries(QUERY_KEYS.UNORGANIZED_TEMPLATES);
        toast.success('Folder deleted successfully');
      },
      onError: (error: Error) => {
        console.error('Error deleting folder:', error);
        toast.error(`Failed to delete folder: ${error.message}`);
      }
    }
  );
  
  // Toggle folder pin status
  const toggleFolderPin = useMutation(
    async ({ folderId, isPinned, type }: TogglePinParams) => {
      const response = await promptApi.toggleFolderPin(folderId, isPinned, type);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update pin status');
      }
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(QUERY_KEYS.PINNED_FOLDERS);
        queryClient.invalidateQueries(QUERY_KEYS.USER_METADATA);
        toast.success('Folder pin status updated');
      },
      onError: (error: Error) => {
        console.error('Error toggling pin status:', error);
        toast.error(`Failed to update pin status: ${error.message}`);
      }
    }
  );
  
  return {
    createFolder,
    updateFolder,
    deleteFolder,
    toggleFolderPin
  };
}