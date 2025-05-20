// src/hooks/prompts/queries/templates/useUnorganizedTemplates.ts
import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/constants/queryKeys'; // Updated import
import { Template } from '@/types/prompts/templates';

/**
 * Hook to fetch templates without a folder assignment
 */
export function useUnorganizedTemplates() {
  return useQuery(QUERY_KEYS.UNORGANIZED_TEMPLATES, async () => {
    const response = await promptApi.getUnorganizedTemplates();
    console.log('🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉response', response);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch unorganized templates');
    }
    return response.data.filter((template: Template) => !template.folder_id) as Template[];
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load unorganized templates: ${error.message}`);
    }
  });
}