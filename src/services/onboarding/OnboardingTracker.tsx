// src/services/onboarding/OnboardingTracker.ts
import { apiClient } from '@/services/api/ApiClient';

class OnboardingTracker {
  private static instance: OnboardingTracker;
  
  private constructor() {}
  
  public static getInstance(): OnboardingTracker {
    if (!OnboardingTracker.instance) {
      OnboardingTracker.instance = new OnboardingTracker();
    }
    return OnboardingTracker.instance;
  }

  /**
   * Mark an onboarding action as completed
   */
  async markActionCompleted(action: 'first_template_created' | 'first_template_used' | 'first_block_created' | 'keyboard_shortcut_used'): Promise<void> {
    try {
      await apiClient.request('/onboarding/mark-action', {
        method: 'POST',
        body: JSON.stringify({ action })
      });
    } catch (error) {
      console.error('Error marking onboarding action:', error);
      // Don't throw - onboarding tracking shouldn't break the main functionality
    }
  }

  /**
   * Mark template created
   */
  async markTemplateCreated(): Promise<void> {
    return this.markActionCompleted('first_template_created');
  }

  /**
   * Mark template used
   */
  async markTemplateUsed(): Promise<void> {
    return this.markActionCompleted('first_template_used');
  }

  /**
   * Mark block created
   */
  async markBlockCreated(): Promise<void> {
    return this.markActionCompleted('first_block_created');
  }

  /**
   * Mark keyboard shortcut used
   */
  async markKeyboardShortcutUsed(): Promise<void> {
    return this.markActionCompleted('keyboard_shortcut_used');
  }
}

export const onboardingTracker = OnboardingTracker.getInstance();