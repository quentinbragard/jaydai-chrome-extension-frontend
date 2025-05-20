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
    console.log('officialIds------------------>>', officialIds);
    let officialFolders: TemplateFolder[] = [];
    
    if (officialIds.length > 0) {
      const officialResponse = await promptApi.getAllFolders('official', false, userLocale);
      console.log('officialResponse------------------>>', officialResponse);
      if (officialResponse.success) {
        officialFolders = officialResponse.data
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
      const orgResponse = await promptApi.getAllFolders('organization', false, userLocale);
      if (orgResponse.success) {
        orgFolders = orgResponse.data
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