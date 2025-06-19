// src/hooks/prompts/queries/folders/usePinnedFolders.ts
import { useQuery } from 'react-query';
import { promptApi, userApi } from '@/services/api';
import { toast } from 'sonner';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { QUERY_KEYS } from '@/constants/queryKeys'; // Updated import
import { TemplateFolder } from '@/types/prompts/templates';

export function usePinnedFolders() {
  const userLocale = getCurrentLanguage();
  
  return useQuery(QUERY_KEYS.PINNED_FOLDERS, async () => {
    // First get user metadata to find pinned folder IDs
    const metadata = await userApi.getUserMetadata();
    if (!metadata.success) {
      throw new Error(metadata.error || 'Failed to get user metadata');
    }
    
    // Support both new and legacy metadata structures for pinned folders
    // `pinned_folder_ids` is the newer consolidated field containing all pinned
    // folder IDs. Older metadata stored organization folder IDs separately.
    const legacyOrgIds = metadata.data?.pinned_organization_folder_ids || [];
    const genericPinnedIds = metadata.data?.pinned_folder_ids || [];

    // Get organization pinned folders with locale filtering. Use the merged set
    // of generic pinned IDs plus any legacy organization specific IDs.
    const orgIds = Array.from(new Set([...legacyOrgIds, ...genericPinnedIds]));
    let orgFolders: TemplateFolder[] = [];

    if (orgIds.length > 0) {
      const orgResponse = await promptApi.getFolders('organization', true, true, userLocale);
      if (orgResponse.success) {
        const allFolders = (orgResponse.data.folders.organization || []) as TemplateFolder[];
        orgFolders = allFolders
          .filter((folder: TemplateFolder) => orgIds.includes(folder.id))
          .map((folder: TemplateFolder) => ({
            ...folder,
            is_pinned: true
          }));
      }
    }
    
    return {
      organization: orgFolders
    };
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load pinned folders: ${error.message}`);
    }
  });
}