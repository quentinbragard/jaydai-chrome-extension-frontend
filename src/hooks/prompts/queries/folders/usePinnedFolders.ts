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
    
    // Get official pinned folders with locale filtering
    const officialIds = metadata.data?.pinned_official_folder_ids || [];
    let officialFolders: TemplateFolder[] = [];

    if (officialIds.length > 0) {
      const officialResponse = await promptApi.getFolders('official', true, true, userLocale);
      if (officialResponse.success) {
        const allFolders = (officialResponse.data.folders.official || []) as TemplateFolder[];
        officialFolders = allFolders
          .filter((folder: TemplateFolder) => officialIds.includes(folder.id))
          .map((folder: TemplateFolder) => ({
            ...folder,
            is_pinned: true
          }));
      }
    }
    
    // Get organization pinned folders with locale filtering
    const orgIds = metadata.data?.pinned_organization_folder_ids || [];
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
      official: officialFolders,
      organization: orgFolders
    };
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load pinned folders: ${error.message}`);
    }
  });
}