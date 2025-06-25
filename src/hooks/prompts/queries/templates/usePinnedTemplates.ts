import { useQuery } from 'react-query';
import { promptApi, userApi } from '@/services/api';
import { toast } from 'sonner';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Template, TemplateFolder } from '@/types/prompts/templates';


export function usePinnedTemplates() {
  const userLocale = getCurrentLanguage();

  return useQuery(QUERY_KEYS.PINNED_TEMPLATES, async () => {
    const metadata = await userApi.getUserMetadata();
    if (!metadata.success) {
      throw new Error(metadata.error || 'Failed to get user metadata');
    }

    console.log("metadata👉👉👉👉👉👉👉", metadata);


    const pinnedIds = metadata.data?.pinned_template_ids || [];

    

    return pinnedIds;
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load pinned templates: ${error.message}`);
    }
  });
}
