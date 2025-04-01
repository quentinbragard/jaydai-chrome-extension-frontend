import { useQuery } from 'react-query';
import { promptApi, userApi } from '@/services/api';
import { toast } from 'sonner';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { QUERY_KEYS } from '../queryKeys';
import { TemplateFolder } from '@/types/templates';

export function useAllFoldersOfType(type: 'official' | 'organization') {
  const userLocale = getCurrentLanguage();
  
  return useQuery([QUERY_KEYS.ALL_FOLDERS, type], async () => {
    // Load all folders of the specified type with locale filtering
    const response = await promptApi.getAllFolders(type, true, userLocale);
    if (!response.success) {
      throw new Error(response.error || `Failed to load ${type} folders`);
    }
    
    // Get user metadata to determine which folders are pinned
    const metadata = await userApi.getUserMetadata();
    if (!metadata.success) {
      throw new Error(metadata.error || 'Failed to get user metadata');
    }
    
    // Get pinned folder IDs based on folder type
    const pinnedIds = type === 'official' 
      ? metadata.data?.pinned_official_folder_ids || []
      : metadata.data?.pinned_organization_folder_ids || [];
    
    // Mark pinned status on each folder
    return response.folders.map((folder: TemplateFolder) => ({
      ...folder,
      is_pinned: pinnedIds.includes(folder.id)
    }));
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load ${type} folders: ${error.message}`);
    }
  });
} 