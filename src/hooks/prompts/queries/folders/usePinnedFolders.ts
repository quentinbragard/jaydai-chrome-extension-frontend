// src/hooks/prompts/queries/folders/usePinnedFolders.ts
import { useQuery } from 'react-query';
import { promptApi, userApi } from '@/services/api';
import { toast } from 'sonner';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { TemplateFolder } from '@/types/prompts/templates';

export function usePinnedFolders() {
  const userLocale = getCurrentLanguage();
  console.log('🌍 usePinnedFolders locale:', userLocale);

  return useQuery(
    QUERY_KEYS.PINNED_FOLDERS, 
    async () => {
      console.log('🚀 Fetching pinned folders...');
      
      const pinnedFoldersResponse = await promptApi.getPinnedFolders(true, true, userLocale);
      
      console.log('📦 Pinned folders API response:', pinnedFoldersResponse);
      
      if (!pinnedFoldersResponse.success) {
        const errorMessage = pinnedFoldersResponse.error || pinnedFoldersResponse.message || 'Failed to fetch pinned folders';
        console.error('❌ Pinned folders fetch failed:', errorMessage);
        throw new Error(errorMessage);
      }

      // Handle different response structures
      let pinnedFolders = pinnedFoldersResponse.data?.folders || [];
      
      // Ensure we have an array
      if (!Array.isArray(pinnedFolders)) {
        // If it's an object with arrays, flatten it
        if (typeof pinnedFolders === 'object') {
          const flattenedFolders: TemplateFolder[] = [];
          Object.values(pinnedFolders).forEach((folderArray: any) => {
            if (Array.isArray(folderArray)) {
              flattenedFolders.push(...folderArray);
            }
          });
          pinnedFolders = flattenedFolders;
        } else {
          pinnedFolders = [];
        }
      }

      console.log('✅ Processed pinned folders:', pinnedFolders);
      
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
      },
      onSuccess: (data) => {
        console.log('✅ usePinnedFolders success:', data);
      }
    }
  );
}