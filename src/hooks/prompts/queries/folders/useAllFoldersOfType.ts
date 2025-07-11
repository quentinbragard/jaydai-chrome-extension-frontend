import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { TemplateFolder } from '@/types/prompts/templates';

/**
 * Hook to fetch all folders of a specific type (organization, company)
 */
export function useAllFoldersOfType(folderType: 'organization' | 'company') {
  const userLocale = getCurrentLanguage();
  
  return useQuery(
    [QUERY_KEYS.ALL_FOLDERS, folderType], // Query key array with type
    async () => {
      const response = await promptApi.getFolders(folderType, true, true, userLocale);

      if (!response.success) {
        throw new Error(response.message || `Failed to fetch ${folderType} folders`);
      }

      return (response.data.folders[folderType] || []) as TemplateFolder[];
    },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      onError: (error: Error) => {
        toast.error(`Failed to load ${folderType} folders: ${error.message}`);
      }
    }
  );
}