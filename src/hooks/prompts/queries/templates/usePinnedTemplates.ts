import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Template } from '@/types/prompts/templates';

export function usePinnedTemplates() {
  return useQuery(QUERY_KEYS.PINNED_TEMPLATES, async () => {
    const response = await promptApi.getPinnedTemplates();
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch pinned templates');
    }
    return response.data as Template[];
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load pinned templates: ${error.message}`);
    }
  });
}
