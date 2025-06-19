import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { TemplateFolder } from '@/types/prompts/templates';

export function useAllFolders() {
  const userLocale = getCurrentLanguage();
  
  return useQuery(QUERY_KEYS.ALL_FOLDERS, async () => {
    const organizationResponse = await promptApi.getFolders('organization', true, true, userLocale);

    if (!organizationResponse.success) {
      throw new Error('Failed to fetch folders');
    }

    return {
      organization: (organizationResponse.data.folders.organization || []) as TemplateFolder[]
    };
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load folders: ${error.message}`);
    }
  });
} 