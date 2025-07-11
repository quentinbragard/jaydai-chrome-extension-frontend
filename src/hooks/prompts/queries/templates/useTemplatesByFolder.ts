import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Template } from '@/types/prompts/templates';

export function useTemplatesByFolder(folderId: number) {
  return useQuery(
    [QUERY_KEYS.TEMPLATES_BY_FOLDER, folderId],
    async () => {
      const response = await promptApi.getTemplatesByFolder(folderId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch templates');
      }
      return response.data as Template[];
    },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      onError: (error: Error) => {
        toast.error(`Failed to load templates: ${error.message}`);
      }
    }
  );
}
