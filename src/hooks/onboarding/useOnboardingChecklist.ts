// src/hooks/onboarding/useOnboardingChecklist.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api/ApiClient';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';

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

interface OnboardingApiResponse {
  success: boolean;
  data: OnboardingChecklistData;
  message?: string;
}

export function useOnboardingChecklist() {
  const [checklist, setChecklist] = useState<OnboardingChecklistData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch checklist data
  const fetchChecklist = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.request<OnboardingApiResponse>('/onboarding/checklist');
      
      if (response.success && response.data) {
        setChecklist(response.data);
      }
    } catch (error) {
      console.error('Error fetching onboarding checklist:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for onboarding updates from other parts of the app
  useEffect(() => {
    const handler = () => {
      fetchChecklist();
    };
    document.addEventListener('jaydai:onboarding-action-completed', handler);
    return () => {
      document.removeEventListener('jaydai:onboarding-action-completed', handler);
    };
  }, [fetchChecklist]);

  // Mark action as completed
  const markActionCompleted = useCallback(async (action: string) => {
    try {
      setIsUpdating(true);
      const response = await apiClient.request<OnboardingApiResponse>('/onboarding/mark-action', {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      
      if (response.success && response.data) {
        setChecklist(response.data);
      }
    } catch (error) {
      console.error('Error marking onboarding action:', error);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Dismiss onboarding
  const dismissOnboarding = useCallback(async () => {
    try {
      setIsUpdating(true);
      const response = await apiClient.request<{
        success: boolean;
        message: string;
      }>('/onboarding/dismiss', {
        method: 'POST'
      });
      
      if (response.success) {
        setChecklist(prev => prev ? { ...prev, is_dismissed: true } : null);
        toast.success(getMessage('onboardingDismissed', undefined, 'Onboarding dismissed'));
      }
    } catch (error) {
      console.error('Error dismissing onboarding:', error);
      toast.error(getMessage('errorDismissingOnboarding', undefined, 'Failed to dismiss onboarding'));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  // Public methods to manually mark actions (for when actions happen in other parts of the app)
  const markTemplateCreated = useCallback(() => markActionCompleted('first_template_created'), [markActionCompleted]);
  const markTemplateUsed = useCallback(() => markActionCompleted('first_template_used'), [markActionCompleted]);
  const markBlockCreated = useCallback(() => markActionCompleted('first_block_created'), [markActionCompleted]);
  const markKeyboardShortcutUsed = useCallback(() => markActionCompleted('keyboard_shortcut_used'), [markActionCompleted]);

  return {
    checklist,
    isLoading,
    isUpdating,
    fetchChecklist,
    dismissOnboarding,
    markTemplateCreated,
    markTemplateUsed,
    markBlockCreated,
    markKeyboardShortcutUsed
  };
}