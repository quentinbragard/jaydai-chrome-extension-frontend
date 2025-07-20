import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Template } from '@/types/prompts/templates';

export function useTemplateById(templateId?: number) {
  return useQuery(
    [QUERY_KEYS.TEMPLATE_BY_ID, templateId],
    async () => {
      if (templateId === undefined) return null as Template | null;
      const response = await promptApi.getTemplateById(templateId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch template');
      }
      return response.data as Template;
    },
    {
      enabled: templateId !== undefined,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      onError: (error: Error) => {
        toast.error(`Failed to load template: ${error.message}`);
      }
    }
  );
}
