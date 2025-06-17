// src/hooks/prompts/queries/folders/useUserFolders.ts
import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { TemplateFolder } from '@/types/prompts/templates';

export function useUserFolders() {
  const locale = getCurrentLanguage();

  return useQuery(QUERY_KEYS.USER_FOLDERS, async () => {
    const response = await promptApi.getFolders('user', true, true, locale);
    if (!response.success) {
      throw new Error(response.message || 'Failed to load user folders');
    }

    return (response.data.folders.user || []) as TemplateFolder[];
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load user folders: ${error.message}`);
    }
  });
}