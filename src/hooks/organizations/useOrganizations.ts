// src/hooks/organizations/useOrganizations.ts
import { useQuery } from 'react-query';
import { organizationsApi } from '@/services/api';
import { Organization } from '@/types/organizations';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/constants/queryKeys';

/**
 * Hook to fetch all organizations the user has access to
 */
export function useOrganizations() {
  return useQuery(
    QUERY_KEYS.ORGANIZATIONS,
    async (): Promise<Organization[]> => {
      const response = await organizationsApi.getOrganizations();
      if (!response.success) {
        throw new Error(response.message || 'Failed to load organizations');
      }
      return response.data || [];
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onError: (error: Error) => {
        toast.error(`Failed to load organizations: ${error.message}`);
      }
    }
  );
}

/**
 * Hook to fetch a specific organization by ID
 */
export function useOrganizationById(organizationId?: string) {
  return useQuery(
    [QUERY_KEYS.ORGANIZATION_BY_ID, organizationId],
    async (): Promise<Organization | null> => {
      if (!organizationId) return null;
      
      const response = await organizationsApi.getOrganizationById(organizationId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to load organization');
      }
      return response.data || null;
    },
    {
      enabled: !!organizationId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onError: (error: Error) => {
        toast.error(`Failed to load organization: ${error.message}`);
      }
    }
  );
}