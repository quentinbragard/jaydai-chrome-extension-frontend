import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Template } from '@/types/prompts/templates';

export function useTemplatesByFolder(folderId?: number, enabled = true) {
  return useQuery([QUERY_KEYS.TEMPLATES_BY_FOLDER, folderId], async () => {
    if (folderId === undefined) return [] as Template[];
    const response = await promptApi.getTemplatesByFolder(folderId);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch folder templates');
    }
    return response.data as Template[];
  }, {
    staleTime: 5 * 60 * 1000,
    enabled: enabled && folderId !== undefined,
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load templates: ${error.message}`);
    }
  });
}
