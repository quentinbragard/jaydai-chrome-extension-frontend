import { useQuery } from 'react-query';
import { userApi } from '@/services/api';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function usePinnedTemplates() {
  return useQuery(QUERY_KEYS.PINNED_TEMPLATES, async () => {
    const metadata = await userApi.getUserMetadata();
    if (!metadata.success) {
      throw new Error(metadata.error || 'Failed to get user metadata');
    }

    const pinnedIds: number[] = metadata.data?.pinned_template_ids || [];
    return pinnedIds;
  }, {
    refetchOnWindowFocus: false,
    onError: (error: Error) => {
      toast.error(`Failed to load pinned templates: ${error.message}`);
    }
  });
}
