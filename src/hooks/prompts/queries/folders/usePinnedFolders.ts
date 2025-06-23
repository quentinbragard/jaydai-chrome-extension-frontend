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
    // Fetch user metadata to get pinned folder IDs
    const metadata = await userApi.getUserMetadata();
    if (!metadata.success) {
      throw new Error(metadata.error || 'Failed to get user metadata');
    }

    // Consolidated pinned folder IDs (new field) plus legacy organization IDs
    const genericIds = metadata.data?.pinned_folder_ids || [];
    const legacyOrgIds = metadata.data?.pinned_organization_folder_ids || [];

    const pinnedIds = Array.from(new Set([...genericIds, ...legacyOrgIds]));

    let userPinned: TemplateFolder[] = [];
    let orgPinned: TemplateFolder[] = [];

    if (pinnedIds.length > 0) {
      // Fetch both user and organization folders and filter by pinned IDs
      const [userResponse, orgResponse] = await Promise.all([
        promptApi.getFolders('user', true, true, userLocale),
        promptApi.getFolders('organization', true, true, userLocale)
      ]);

        if (userResponse.success) {
        const uFolders = (userResponse.data.folders.user || []) as TemplateFolder[];
        userPinned = uFolders
          .filter(folder => pinnedIds.includes(folder.id))
          .map(folder => ({ ...folder, is_pinned: true }));
      }

        if (orgResponse.success) {
        const oFolders = (orgResponse.data.folders.organization || []) as TemplateFolder[];
        orgPinned = oFolders
          .filter(folder => pinnedIds.includes(folder.id))
          .map(folder => ({ ...folder, is_pinned: true }));
      }
    }

    return {
      user: userPinned,
      organization: orgPinned
    };
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load pinned folders: ${error.message}`);
    }
  });
}