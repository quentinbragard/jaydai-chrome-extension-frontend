// src/hooks/useOnboardingChecklist.ts
import { useCallback } from 'react';
import { userApi } from '@/services/api/UserApi';
import { trackEvent, EVENTS } from '@/utils/amplitude';

interface OnboardingChecklistData {
  first_template_created: boolean;
  first_template_used: boolean;
  first_block_created: boolean;
  keyboard_shortcut_used: boolean;
  progress: string;
  completed_count: number;
  total_count: number;
  is_complete: boolean;
}

/**
 * Custom hook for managing onboarding checklist updates
 * Provides methods to mark actions as complete when they occur
 */
export function useOnboardingChecklist() {
  
  // Mark first template created
  const markFirstTemplateCreated = useCallback(async () => {
    try {
      const response = await userApi.markFirstTemplateCreated();
      if (response.success) {
        trackEvent(EVENTS.ONBOARDING_CHECKLIST_ITEM_COMPLETED, {
          action: 'first_template_created',
          progress: response.data?.progress || 'unknown'
        });
        if (response.data) {
          document.dispatchEvent(
            new CustomEvent('jaydai:onboarding-checklist-updated', {
              detail: response.data
            })
          );
        }
        return response.data;
      }
    } catch (error) {
      console.error('Error marking first template created:', error);
    }
    return null;
  }, []);

  // Mark first template used
  const markFirstTemplateUsed = useCallback(async () => {
    try {
      const response = await userApi.markFirstTemplateUsed();
      if (response.success) {
        trackEvent(EVENTS.ONBOARDING_CHECKLIST_ITEM_COMPLETED, {
          action: 'first_template_used',
          progress: response.data?.progress || 'unknown'
        });
        if (response.data) {
          document.dispatchEvent(
            new CustomEvent('jaydai:onboarding-checklist-updated', {
              detail: response.data
            })
          );
        }
        return response.data;
      }
    } catch (error) {
      console.error('Error marking first template used:', error);
    }
    return null;
  }, []);

  // Mark first block created
  const markFirstBlockCreated = useCallback(async () => {
    try {
      const response = await userApi.markFirstBlockCreated();
      if (response.success) {
        trackEvent(EVENTS.ONBOARDING_CHECKLIST_ITEM_COMPLETED, {
          action: 'first_block_created',
          progress: response.data?.progress || 'unknown'
        });
        if (response.data) {
          document.dispatchEvent(
            new CustomEvent('jaydai:onboarding-checklist-updated', {
              detail: response.data
            })
          );
        }
        return response.data;
      }
    } catch (error) {
      console.error('Error marking first block created:', error);
    }
    return null;
  }, []);

  // Mark keyboard shortcut used
  const markKeyboardShortcutUsed = useCallback(async () => {
    try {
      const response = await userApi.markKeyboardShortcutUsed();
      if (response.success) {
        trackEvent(EVENTS.ONBOARDING_CHECKLIST_ITEM_COMPLETED, {
          action: 'keyboard_shortcut_used',
          progress: response.data?.progress || 'unknown'
        });
        if (response.data) {
          document.dispatchEvent(
            new CustomEvent('jaydai:onboarding-checklist-updated', {
              detail: response.data
            })
          );
        }
        return response.data;
      }
    } catch (error) {
      console.error('Error marking keyboard shortcut used:', error);
    }
    return null;
  }, []);

  // Generic method to update multiple items at once
  const updateChecklist = useCallback(async (updates: Partial<{
    first_template_created: boolean;
    first_template_used: boolean;
    first_block_created: boolean;
    keyboard_shortcut_used: boolean;
  }>) => {
    try {
      const response = await userApi.updateOnboardingChecklist(updates);
      if (response.success) {
        // Track each completed action
        Object.entries(updates).forEach(([action, completed]) => {
          if (completed) {
            trackEvent(EVENTS.ONBOARDING_CHECKLIST_ITEM_COMPLETED, {
              action,
              progress: response.data?.progress || 'unknown'
            });
          }
        });
        if (response.data) {
          document.dispatchEvent(
            new CustomEvent('jaydai:onboarding-checklist-updated', {
              detail: response.data
            })
          );
        }
        return response.data;
      }
    } catch (error) {
      console.error('Error updating onboarding checklist:', error);
    }
    return null;
  }, []);

  // Get current checklist status
  const getChecklistStatus = useCallback(async (): Promise<OnboardingChecklistData | null> => {
    try {
      const response = await userApi.getOnboardingChecklist();
      if (response.success) {
        return response.data || null;
      }
    } catch (error) {
      console.error('Error fetching onboarding checklist:', error);
    }
    return null;
  }, []);

  return {
    markFirstTemplateCreated,
    markFirstTemplateUsed,
    markFirstBlockCreated,
    markKeyboardShortcutUsed,
    updateChecklist,
    getChecklistStatus
  };
}

export default useOnboardingChecklist;