import { useQuery } from 'react-query';
import { userApi } from '@/services/api';
import { QUERY_KEYS } from '../queryKeys';

export function useUserMetadata() {
  return useQuery(QUERY_KEYS.USER_METADATA, async () => {
    const response = await userApi.getUserMetadata();
    if (!response.success) {
      throw new Error(response.error || 'Failed to get user metadata');
    }
    return response.data;
  });
} 