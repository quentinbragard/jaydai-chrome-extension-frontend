// src/hooks/prompts/queries/folders/usePinnedFolders.ts - Fixed Version
import { useQuery } from 'react-query';
import { promptApi, userApi } from '@/services/api';
import { toast } from 'sonner';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { TemplateFolder } from '@/types/prompts/templates';

export function usePinnedFolders() {
  const userLocale = getCurrentLanguage();

  return useQuery(
    QUERY_KEYS.PINNED_FOLDERS, 
    async () => {
      
      const pinnedFoldersResponse = await promptApi.getPinnedFolders(true, true, userLocale);
            
      if (!pinnedFoldersResponse.success) {
        const errorMessage = pinnedFoldersResponse.error || pinnedFoldersResponse.message || 'Failed to fetch pinned folders';
        console.error('❌ Pinned folders fetch failed:', errorMessage);
        throw new Error(errorMessage);
      }

      // Handle different response structures
      let pinnedFolders: TemplateFolder[] = [];
      
      // Check if data exists
      if (pinnedFoldersResponse.data) {
        // Handle the new flat array structure
        if (Array.isArray(pinnedFoldersResponse.data)) {
          pinnedFolders = pinnedFoldersResponse.data;
        }
        // Handle nested folders structure
        else if (pinnedFoldersResponse.data.folders) {
          if (Array.isArray(pinnedFoldersResponse.data.folders)) {
            pinnedFolders = pinnedFoldersResponse.data.folders;
          } else if (typeof pinnedFoldersResponse.data.folders === 'object') {
            // If it's an object with arrays, flatten it
            const flattenedFolders: TemplateFolder[] = [];
            Object.values(pinnedFoldersResponse.data.folders).forEach((folderArray: any) => {
              if (Array.isArray(folderArray)) {
                flattenedFolders.push(...folderArray);
              }
            });
            pinnedFolders = flattenedFolders;
          }
        }
        // Handle direct array at data level
        else if (Array.isArray(pinnedFoldersResponse.data)) {
          pinnedFolders = pinnedFoldersResponse.data;
        }
      }

      // Ensure we always return an array
      if (!Array.isArray(pinnedFolders)) {
        console.warn('⚠️ Pinned folders is not an array, defaulting to empty array');
        pinnedFolders = [];
      }

      
      return pinnedFolders;
    }, 
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 404 or authentication errors
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (errorMessage.includes('404') || errorMessage.includes('unauthorized')) {
            return false;
          }
        }
        return failureCount < 2; // Retry up to 2 times
      },
      onError: (error: Error) => {
        console.error('❌ usePinnedFolders error:', error);
        toast.error(`Failed to load pinned folders: ${error.message}`);
      }
    }
  );
}

