// src/hooks/onboarding/useOnboardingChecklist.ts - Optimized Version
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '@/services/api/ApiClient';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/constants/queryKeys';

interface OnboardingChecklistData {
  first_template_created: boolean;
  first_template_used: boolean;
  first_block_created: boolean;
  keyboard_shortcut_used: boolean;
  progress: string;
  completed_count: number;
  total_count: number;
  is_complete: boolean;
  is_dismissed: boolean;
}

// Cache key for onboarding data
const ONBOARDING_CACHE_KEY = 'onboarding_checklist';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useOnboardingChecklist() {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Optimized query with aggressive caching and background updates
  const {
    data: checklist,
    isLoading,
    error,
    refetch
  } = useQuery<OnboardingChecklistData>(
    [QUERY_KEYS.ONBOARDING_CHECKLIST],
    async () => {
      const response = await apiClient.request('/onboarding/checklist');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch onboarding status');
      }
      return response.data;
    },
    {
      // Aggressive caching for better performance
      staleTime: CACHE_DURATION,
      cacheTime: CACHE_DURATION * 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      // Enable background updates only when component is visible
      refetchInterval: 30000, // 30 seconds
      refetchIntervalInBackground: false,
      // Retry configuration
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Keep previous data while refetching
      keepPreviousData: true,
      onError: (error) => {
        console.error('Onboarding checklist error:', error);
      }
    }
  );

  // Optimized mutation factory with optimistic updates
  const createOptimisticMutation = useCallback((
    action: string,
    apiCall: () => Promise<any>
  ) => {
    return useMutation(
      apiCall,
      {
        // Optimistic update for instant UI feedback
        onMutate: async () => {
          setIsUpdating(true);
          
          // Cancel outgoing refetches
          await queryClient.cancelQueries([QUERY_KEYS.ONBOARDING_CHECKLIST]);
          
          // Snapshot previous value
          const previousData = queryClient.getQueryData<OnboardingChecklistData>([QUERY_KEYS.ONBOARDING_CHECKLIST]);
          
          // Optimistically update cache
          if (previousData) {
            const newData = {
              ...previousData,
              [action]: true,
              completed_count: previousData.completed_count + (previousData[action as keyof OnboardingChecklistData] ? 0 : 1),
              is_complete: (previousData.completed_count + 1) >= previousData.total_count
            };
            newData.progress = `${newData.completed_count}/${newData.total_count}`;
            
            queryClient.setQueryData([QUERY_KEYS.ONBOARDING_CHECKLIST], newData);
          }
          
          return { previousData };
        },
        onError: (error, variables, context) => {
          // Rollback on error
          if (context?.previousData) {
            queryClient.setQueryData([QUERY_KEYS.ONBOARDING_CHECKLIST], context.previousData);
          }
          console.error(`Error marking ${action}:`, error);
          toast.error(`Failed to update progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
        },
        onSuccess: () => {
          // Invalidate and refetch in background
          queryClient.invalidateQueries([QUERY_KEYS.ONBOARDING_CHECKLIST]);
        },
        onSettled: () => {
          setIsUpdating(false);
        }
      }
    );
  }, [queryClient]);

  // Individual action mutations with optimistic updates
  const markTemplateCreatedMutation = createOptimisticMutation(
    'first_template_created',
    () => apiClient.request('/onboarding/mark-action', {
      method: 'POST',
      body: JSON.stringify({ action: 'first_template_created' })
    })
  );

  const markTemplateUsedMutation = createOptimisticMutation(
    'first_template_used',
    () => apiClient.request('/onboarding/mark-action', {
      method: 'POST',
      body: JSON.stringify({ action: 'first_template_used' })
    })
  );

  const markBlockCreatedMutation = createOptimisticMutation(
    'first_block_created',
    () => apiClient.request('/onboarding/mark-action', {
      method: 'POST',
      body: JSON.stringify({ action: 'first_block_created' })
    })
  );

  const markKeyboardShortcutUsedMutation = createOptimisticMutation(
    'keyboard_shortcut_used',
    () => apiClient.request('/onboarding/mark-action', {
      method: 'POST',
      body: JSON.stringify({ action: 'keyboard_shortcut_used' })
    })
  );

  // Dismiss mutation with optimistic update
  const dismissMutation = useMutation(
    () => apiClient.request('/onboarding/dismiss', {
      method: 'POST'
    }),
    {
      onMutate: async () => {
        setIsUpdating(true);
        await queryClient.cancelQueries([QUERY_KEYS.ONBOARDING_CHECKLIST]);
        
        const previousData = queryClient.getQueryData<OnboardingChecklistData>([QUERY_KEYS.ONBOARDING_CHECKLIST]);
        
        if (previousData) {
          queryClient.setQueryData([QUERY_KEYS.ONBOARDING_CHECKLIST], {
            ...previousData,
            is_dismissed: true
          });
        }
        
        return { previousData };
      },
      onError: (error, variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData([QUERY_KEYS.ONBOARDING_CHECKLIST], context.previousData);
        }
        console.error('Error dismissing onboarding:', error);
        toast.error(`Failed to dismiss onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
      onSuccess: () => {
        toast.success('Onboarding dismissed');
        queryClient.invalidateQueries([QUERY_KEYS.ONBOARDING_CHECKLIST]);
      },
      onSettled: () => {
        setIsUpdating(false);
      }
    }
  );

  // Memoized action handlers to prevent unnecessary re-renders
  const actionHandlers = useMemo(() => ({
    markTemplateCreated: () => markTemplateCreatedMutation.mutate(),
    markTemplateUsed: () => markTemplateUsedMutation.mutate(),
    markBlockCreated: () => markBlockCreatedMutation.mutate(),
    markKeyboardShortcutUsed: () => markKeyboardShortcutUsedMutation.mutate(),
    dismissOnboarding: () => dismissMutation.mutate()
  }), [
    markTemplateCreatedMutation,
    markTemplateUsedMutation,
    markBlockCreatedMutation,
    markKeyboardShortcutUsedMutation,
    dismissMutation
  ]);

  // Memoized derived state
  const derivedState = useMemo(() => ({
    shouldShow: checklist && !checklist.is_dismissed && !checklist.is_complete,
    progressPercentage: checklist ? (checklist.completed_count / checklist.total_count) * 100 : 0,
    remainingActions: checklist ? checklist.total_count - checklist.completed_count : 0
  }), [checklist]);

  return {
    checklist,
    isLoading,
    isUpdating: isUpdating || 
      markTemplateCreatedMutation.isLoading || 
      markTemplateUsedMutation.isLoading || 
      markBlockCreatedMutation.isLoading || 
      markKeyboardShortcutUsedMutation.isLoading || 
      dismissMutation.isLoading,
    error,
    refetch,
    ...actionHandlers,
    ...derivedState
  };
}