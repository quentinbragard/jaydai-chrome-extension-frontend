// src/components/panels/TemplatesPanel/OnboardingChecklist.tsx - Compact Version
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Circle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { cn } from '@/core/utils/classNames';
import { getMessage } from '@/core/utils/i18n';
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

interface OnboardingChecklistProps {
  onCreateTemplate?: () => void;
  onCreateBlock?: () => void;
  className?: string;
}

interface ChecklistItem {
  key: keyof Omit<OnboardingChecklistData, 'progress' | 'completed_count' | 'total_count' | 'is_complete'>;
  title: string;
  action?: () => void;
  showInfoDialog?: boolean;
}

/**
 * Compact OnboardingChecklist component - minimal space usage
 */
export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  onCreateTemplate,
  onCreateBlock,
  className = ''
}) => {
  const [checklistData, setChecklistData] = useState<OnboardingChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKeyboardInfo, setShowKeyboardInfo] = useState(false);

  // Define compact checklist items
  const checklistItems: ChecklistItem[] = [
    {
      key: 'first_template_created',
      title: getMessage('onboarding_create_template', undefined, 'Create first template'),
      action: onCreateTemplate
    },
    {
      key: 'first_template_used',
      title: getMessage('onboarding_use_template', undefined, 'Use a template')
    },
    {
      key: 'first_block_created',
      title: getMessage('onboarding_create_block', undefined, 'Create first block'),
      action: onCreateBlock
    },
    {
      key: 'keyboard_shortcut_used',
      title: getMessage('onboarding_keyboard_shortcut', undefined, 'Try keyboard shortcut'),
      showInfoDialog: true,
      action: () => setShowKeyboardInfo(true)
    }
  ];

  // Fetch checklist data
  const fetchChecklistData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userApi.getOnboardingChecklist();
      if (response.success && response.data) {
        setChecklistData(response.data);
      }
    } catch (error) {
      console.error('Error fetching onboarding checklist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChecklistData();
  }, [fetchChecklistData]);

  // Handle item clicks
  const handleItemClick = useCallback((item: ChecklistItem) => {
    if (checklistData?.[item.key]) return; // Already completed
    
    if (item.action) {
      item.action();
    }
    
    trackEvent(EVENTS.ONBOARDING_CHECKLIST_ACTION_CLICKED, {
      action: item.key,
      current_progress: checklistData?.progress || '0/4'
    });
  }, [checklistData]);

  if (loading || !checklistData) {
    return null;
  }

  const progressPercentage = (checklistData.completed_count / checklistData.total_count) * 100;

  return (
    <>
      <div className={`jd-bg-gradient-to-r jd-from-blue-50/80 jd-to-purple-50/80 jd-dark:jd-from-blue-950/30 jd-dark:jd-to-purple-950/30 jd-border jd-border-blue-200/50 jd-dark:jd-border-blue-800/30 jd-rounded-lg jd-p-4 jd-space-y-3 ${className}`}>
        {/* Header */}
        <div className="jd-flex jd-items-center jd-justify-between">
          <div className="jd-flex jd-items-center jd-gap-2">
            <h3 className="jd-text-sm jd-font-semibold jd-text-primary">
              {getMessage('get_started_jaydai', undefined, 'Get Started with Jaydai')}
            </h3>
            <Badge variant="secondary" className="jd-text-xs jd-px-2 jd-py-0.5">
              {checklistData.progress}
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <div className="jd-h-1.5 jd-bg-gray-200 jd-dark:jd-bg-gray-700 jd-rounded-full jd-overflow-hidden">
          <div 
            className="jd-h-full jd-bg-gradient-to-r jd-from-blue-500 jd-to-purple-500 jd-rounded-full jd-transition-all jd-duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Compact checklist items */}
        <div className="jd-space-y-1">
          {checklistItems.map((item) => {
            const isCompleted = checklistData[item.key];
            const hasAction = item.action && !isCompleted;
            
            return (
              <button
                key={item.key}
                onClick={() => handleItemClick(item)}
                disabled={isCompleted || !item.action}
                className={cn(
                  'jd-w-full jd-flex jd-items-center jd-gap-2 jd-p-2 jd-rounded-md jd-text-left jd-transition-all jd-duration-200 jd-text-sm',
                  hasAction && 'hover:jd-bg-white/60 jd-dark:hover:jd-bg-gray-800/60 jd-cursor-pointer',
                  isCompleted && 'jd-opacity-75',
                  !hasAction && !isCompleted && 'jd-cursor-default'
                )}
              >
                {/* Checkbox */}
                {isCompleted ? (
                  <CheckCircle2 className="jd-h-4 jd-w-4 jd-text-green-600 jd-dark:jd-text-green-400 jd-flex-shrink-0" />
                ) : (
                  <Circle className="jd-h-4 jd-w-4 jd-text-gray-400 jd-dark:jd-text-gray-500 jd-flex-shrink-0" />
                )}

                {/* Title */}
                <span className={cn(
                  'jd-flex-1 jd-truncate',
                  isCompleted 
                    ? 'jd-text-green-800 jd-dark:jd-text-green-200 jd-line-through' 
                    : 'jd-text-gray-900 jd-dark:jd-text-gray-100'
                )}>
                  {item.title}
                </span>

                {/* Info icon for keyboard shortcut */}
                {item.showInfoDialog && !isCompleted && (
                  <Info className="jd-h-3 jd-w-3 jd-text-blue-500 jd-flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Completion message */}
        {checklistData.is_complete && (
          <div className="jd-flex jd-items-center jd-gap-2 jd-p-2 jd-bg-green-50 jd-dark:jd-bg-green-950/30 jd-border jd-border-green-200 jd-dark:jd-border-green-800 jd-rounded-md">
            <CheckCircle2 className="jd-h-4 jd-w-4 jd-text-green-600 jd-dark:jd-text-green-400" />
            <span className="jd-text-sm jd-text-green-800 jd-dark:jd-text-green-200">
              {getMessage('onboarding_complete', undefined, 'All set! You\'re ready to go.')}
            </span>
          </div>
        )}
      </div>

      {/* Keyboard Shortcut Info Dialog */}
      <BaseDialog
        open={showKeyboardInfo}
        onOpenChange={setShowKeyboardInfo}
        title={getMessage('keyboard_shortcut_title', undefined, 'Keyboard Shortcut')}
        className="jd-max-w-md"
      >
        <div className="jd-space-y-4">
          <p className="jd-text-sm jd-text-muted-foreground">
            {getMessage('keyboard_shortcut_description', undefined, 'Type "//j" in any text field to quickly insert blocks and templates.')}
          </p>
            
            {/* Placeholder for GIF - replace src with actual GIF URL */}
            <div className="jd-rounded-lg jd-overflow-hidden jd-border jd-bg-gray-100 jd-dark:jd-bg-gray-800">
              <img
                src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//shortchut_demo.gif"
                alt="Keyboard shortcut demonstration"
                className="jd-w-full jd-h-auto"
                onError={(e) => {
                  // Fallback if GIF doesn't load
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Fallback content if GIF fails to load */}
              <div className="jd-p-8 jd-text-center jd-text-sm jd-text-muted-foreground">
                <div className="jd-font-mono jd-text-lg jd-mb-2">//j</div>
                <div>Type this in any text field</div>
              </div>
            </div>

            <div className="jd-flex jd-justify-between jd-items-center jd-pt-2">
              <span className="jd-text-xs jd-text-muted-foreground">
                {getMessage('try_it_anywhere', undefined, 'Try it in ChatGPT, Claude, or any text field!')}
              </span>
              <Button 
                size="sm" 
                onClick={() => setShowKeyboardInfo(false)}
              >
                {getMessage('got_it', undefined, 'Got it!')}
              </Button>
            </div>
          </div>
        </BaseDialog>
    </>
  );
};

export default OnboardingChecklist;