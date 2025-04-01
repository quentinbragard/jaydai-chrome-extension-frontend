import { useMutation, useQueryClient } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { QUERY_KEYS } from '../queryKeys';
import { TemplateFolder } from '@/types/templates';

export function useToggleFolderPin() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async ({ folderId, isPinned, type }: { folderId: number, isPinned: boolean, type: 'official' | 'organization' }) => {
      const response = await promptApi.toggleFolderPin(folderId, isPinned, type);
      if (!response.success) {
        throw new Error(response.error || `Failed to ${isPinned ? 'unpin' : 'pin'} folder`);
      }
      return response;
    },
    {
      onSuccess: (_, variables) => {
        // Show success toast
        toast.success(variables.isPinned ? 'Folder unpinned' : 'Folder pinned');
        
        // Invalidate affected queries to trigger refetch
        queryClient.invalidateQueries(QUERY_KEYS.PINNED_FOLDERS);
        queryClient.invalidateQueries([QUERY_KEYS.ALL_FOLDERS, variables.type]);
        queryClient.invalidateQueries(QUERY_KEYS.USER_METADATA);
      },
      onError: (error: Error) => {
        toast.error(error.message);
      }
    }
  );
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async (folderId: number) => {
      const response = await promptApi.deleteFolder(folderId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete folder');
      }
      return response;
    },
    {
      onSuccess: () => {
        toast.success('Folder deleted successfully');
        
        // Invalidate user folders query to trigger refetch
        queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete folder: ${error.message}`);
      }
    }
  );
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async (folderData: { name: string, path: string, description?: string }) => {
      const response = await promptApi.createFolder(folderData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create folder');
      }
      return response;
    },
    {
      onSuccess: () => {
        toast.success('Folder created successfully');
        
        // Invalidate user folders query to trigger refetch
        queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
      },
      onError: (error: Error) => {
        toast.error(`Failed to create folder: ${error.message}`);
      }
    }
  );
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async (templateId: number) => {
      const response = await promptApi.deleteTemplate(templateId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete template');
      }
      return response;
    },
    {
      onSuccess: () => {
        toast.success('Template deleted successfully');
        
        // Invalidate all affected queries for a complete refresh
        queryClient.invalidateQueries(QUERY_KEYS.USER_FOLDERS);
        queryClient.invalidateQueries(QUERY_KEYS.UNORGANIZED_TEMPLATES);
        queryClient.invalidateQueries(QUERY_KEYS.USER_TEMPLATES);
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete template: ${error.message}`);
      }
    }
  );
} 