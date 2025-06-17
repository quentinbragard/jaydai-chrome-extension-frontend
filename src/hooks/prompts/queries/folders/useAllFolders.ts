import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { TemplateFolder } from '@/types/prompts/templates';

export function useAllFolders() {
  const userLocale = getCurrentLanguage();
  
  return useQuery(QUERY_KEYS.ALL_FOLDERS, async () => {
    const [officialResponse, organizationResponse] = await Promise.all([
      promptApi.getFolders('official', true, true, userLocale),
      promptApi.getFolders('organization', true, true, userLocale)
    ]);

    if (!officialResponse.success || !organizationResponse.success) {
      throw new Error('Failed to fetch folders');
    }

    return {
      official: (officialResponse.data.folders.official || []) as TemplateFolder[],
      organization: (organizationResponse.data.folders.organization || []) as TemplateFolder[]
    };
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load folders: ${error.message}`);
    }
  });
} 