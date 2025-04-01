import { useQuery } from 'react-query';
import { promptApi } from '@/services/api';
import { toast } from 'sonner';
import { QUERY_KEYS } from '../queryKeys';
import { Template } from '@/types/templates';

export function useUnorganizedTemplates() {
  return useQuery(
    [QUERY_KEYS.USER_TEMPLATES, 'unorganized'], 
    async () => {
      const response = await promptApi.getUnorganizedTemplates();
      if (!response.success) {
        throw new Error(response.error || 'Failed to load unorganized templates');
      }
      return response.templates || [];
    }, 
    {
      refetchOnWindowFocus: false,
      onError: (error: Error) => {
        toast.error(`Failed to load unorganized templates: ${error.message}`);
      }
    }
  );
} 