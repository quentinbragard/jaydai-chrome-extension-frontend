import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/services/templates/queryKeys';
import { Template } from '@/types/templates';

export function useUnorganizedTemplates() {
  return useQuery(QUERY_KEYS.UNORGANIZED_TEMPLATES, async () => {
    const response = await promptApi.getUserTemplates();
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch unorganized templates');
    }
    return response.templates.filter((template: Template) => !template.folder_id) as Template[];
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load unorganized templates: ${error.message}`);
    }
  });
} 