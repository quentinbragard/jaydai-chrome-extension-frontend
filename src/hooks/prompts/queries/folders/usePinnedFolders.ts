// src/hooks/prompts/queries/folders/usePinnedFolders.ts
import { useQuery } from 'react-query';
import { promptApi, userApi } from '@/services/api';
import { toast } from 'sonner';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { QUERY_KEYS } from '@/constants/queryKeys'; // Updated import
import { TemplateFolder } from '@/types/prompts/templates';

export function usePinnedFolders() {
  const userLocale = getCurrentLanguage();
  console.log('👀👀👀', userLocale);

  
  return useQuery(QUERY_KEYS.PINNED_FOLDERS, async () => {

    const pinnedFoldersResponse = await promptApi.getPinnedFolders(true, true, userLocale);
    if (!pinnedFoldersResponse.success) {
      throw new Error(pinnedFoldersResponse.error || 'Failed to fetch pinned folders');
    }

    const pinnedFolders = pinnedFoldersResponse.data.folders;
    console.log('👀👀👀', pinnedFolders);
    return pinnedFolders;
  }, {
    staleTime: 5 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load pinned folders: ${error.message}`);
    }
  });
}