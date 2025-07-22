// src/components/panels/TemplatesPanel/OnboardingChecklist.tsx - Optimized Version
import React, { memo, useCallback, useMemo } from 'react';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, X, Play, FileText, Blocks, Keyboard } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';
import { cn } from '@/core/utils/classNames';
import { useDialogActions } from '@/hooks/dialogs/useDialogActions';
import { Template } from '@/types/prompts/templates';

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

interface OnboardingChecklistProps {
  checklist: OnboardingChecklistData;
  onCreateTemplate: () => void;
  onUseTemplate: () => void;
  onSelectTemplate: (template: Template) => void;
  onCreateBlock: () => void;
  onShowKeyboardShortcut: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

// Memoized action item component to prevent unnecessary re-renders
const ActionItem = memo<{
  action: {
    key: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    completed: boolean;
    onClick: () => void;
    disabled?: boolean;
  };
  isDarkMode: boolean;
  isLoading: boolean;
}>(({ action, isDarkMode, isLoading }) => {
  const Icon = action.icon;
  
  return (
    <button
      key={action.key}
      onClick={action.onClick}
      disabled={action.disabled || isLoading}
      className={cn(
        'jd-w-full jd-flex jd-items-center jd-gap-3 jd-p-2 jd-rounded-md jd-text-left jd-transition-colors',
        action.completed
          ? isDarkMode
            ? 'jd-bg-green-950/30 jd-border jd-border-green-800'
            : 'jd-bg-green-50 jd-border jd-border-green-200'
          : action.disabled
          ? isDarkMode
            ? 'jd-bg-gray-900/30 jd-cursor-not-allowed jd-opacity-60'
            : 'jd-bg-gray-50 jd-cursor-not-allowed jd-opacity-60'
          : isDarkMode
          ? 'jd-bg-gray-800/50 jd-border jd-border-gray-700 hover:jd-bg-gray-800 jd-cursor-pointer'
          : 'jd-bg-white jd-border jd-border-gray-200 hover:jd-bg-gray-50 jd-cursor-pointer'
      )}
    >
      <div className="jd-flex-shrink-0">
        {action.completed ? (
          <CheckCircle className="jd-h-5 jd-w-5 jd-text-green-500" />
        ) : (
          <Circle className="jd-h-5 jd-w-5 jd-text-gray-400" />
        )}
      </div>
      <div className="jd-flex-shrink-0">
        <Icon
          className={cn(
            'jd-h-4 jd-w-4',
            action.completed ? 'jd-text-green-600' : 'jd-text-primary'
          )}
        />
      </div>
      <div className="jd-flex-1 jd-min-w-0">
        <p
          className={cn(
            'jd-text-sm jd-font-medium',
            action.completed
              ? isDarkMode
                ? 'jd-text-green-400'
                : 'jd-text-green-700'
              : 'jd-text-foreground'
          )}
        >
          {action.title}
        </p>
      </div>
    </button>
  );
});

ActionItem.displayName = 'ActionItem';

// Memoized progress bar component
const ProgressBar = memo<{
  percentage: number;
  isDarkMode: boolean;
}>(({ percentage, isDarkMode }) => (
  <div
    className={cn(
      'jd-w-full jd-rounded-full jd-h-2 jd-mb-4',
      isDarkMode ? 'jd-bg-secondary/40' : 'jd-bg-secondary/20'
    )}
  >
    <div
      className="jd-bg-primary jd-h-2 jd-rounded-full jd-transition-all jd-duration-300"
      style={{ width: `${percentage}%` }}
    />
  </div>
));

ProgressBar.displayName = 'ProgressBar';

// Memoized completion badge
const CompletionBadge = memo<{
  isDarkMode: boolean;
}>(({ isDarkMode }) => (
  <div
    className={cn(
      'jd-mt-3 jd-p-2 jd-rounded-md jd-border',
      isDarkMode ? 'jd-bg-green-950/30 jd-border-green-800' : 'jd-bg-green-50 jd-border-green-200'
    )}
  >
    <p
      className={cn(
        'jd-text-sm jd-text-center jd-font-medium',
        isDarkMode ? 'jd-text-green-400' : 'jd-text-green-700'
      )}
    >
      🎉 {getMessage('onboardingComplete', undefined, 'Great job! You\'ve completed the onboarding.')}
    </p>
  </div>
));

CompletionBadge.displayName = 'CompletionBadge';

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = memo(({
  checklist,
  onCreateTemplate,
  onUseTemplate,
  onSelectTemplate,
  onCreateBlock,
  onShowKeyboardShortcut,
  onDismiss,
  isLoading = false
}) => {
  const { openInformation } = useDialogActions();
  const isDarkMode = useThemeDetector();

  // Memoize expensive operations
  const progressPercentage = useMemo(
    () => (checklist.completed_count / checklist.total_count) * 100,
    [checklist.completed_count, checklist.total_count]
  );

  // Memoized pinned folders content component
  const PinnedFoldersContent = useCallback(() => {
    // Lazy load this content only when needed
    const LazyPinnedFolders = React.lazy(() => 
      import('./LazyPinnedFoldersContent').then(module => ({ 
        default: module.LazyPinnedFoldersContent 
      }))
    );

    return (
      <React.Suspense fallback={<div>Loading folders...</div>}>
        <LazyPinnedFolders onSelectTemplate={onSelectTemplate} />
      </React.Suspense>
    );
  }, [onSelectTemplate]);

  // Memoized quick selector function
  const openQuickSelector = useCallback(() => {
    try {
      const service: any = window.slashCommandService || {};
      const target = service.inputEl as HTMLElement | null;
      if (target && service.quickSelector) {
        const position = { x: 100, y: 100 }; // Default position
        const cursorPos = 0;
        service.quickSelector.open(position, target, cursorPos, 0);
      }
    } catch (error) {
      console.error('Failed to open quick selector', error);
    }
  }, []);

  // Memoized actions array to prevent recreation on every render
  const actions = useMemo(() => [
    {
      key: 'first_template_used',
      title: getMessage('useFirstTemplate', undefined, 'Use your first template'),
      description: getMessage('useFirstTemplateDesc', undefined, 'Try out the template customization'),
      icon: Play,
      completed: checklist.first_template_used,
      onClick: () =>
        openInformation({
          title: getMessage('useFirstTemplate', undefined, 'Use your first template'),
          description: getMessage('useFirstTemplateInfo', undefined, 'Select a template from one of your pinned folders below.'),
          gifUrl: 'https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//use_template_demo.gif',
          actionText: getMessage('close', undefined, 'Close'),
          children: <PinnedFoldersContent />,
        }),
    },
    {
      key: 'first_template_created',
      title: getMessage('createFirstTemplate', undefined, 'Create your first template'),
      description: getMessage('createFirstTemplateDesc', undefined, 'Build a reusable prompt template'),
      icon: FileText,
      completed: checklist.first_template_created,
      onClick: () =>
        openInformation({
          title: getMessage('createTemplate', undefined, 'Create Template'),
          description: getMessage(
            'createTemplateInfo',
            undefined,
            'Templates let you save and reuse prompts.'
          ),
          gifUrl:
            'https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//templates_demo.gif',
          actionText: getMessage('createTemplate', undefined, 'Create Template'),
          onAction: onCreateTemplate,
        })
    },
    {
      key: 'first_block_created',
      title: getMessage('createFirstBlock', undefined, 'Create your first block'),
      description: getMessage('createFirstBlockDesc', undefined, 'Build reusable prompt components'),
      icon: Blocks,
      completed: checklist.first_block_created,
      onClick: () =>
        openInformation({
          title: getMessage('createBlock', undefined, 'Create Block'),
          description: getMessage(
            'createBlockInfo',
            undefined,
            'Blocks are reusable pieces of prompts.'
          ),
          gifUrl:
            'https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//blocs_demo.gif',
          actionText: getMessage('createBlock', undefined, 'Create Block'),
          onAction: onCreateBlock,
        })
    },
    {
      key: 'keyboard_shortcut_used',
      title: getMessage('useKeyboardShortcut', undefined, 'Learn keyboard shortcuts'),
      description: getMessage('useKeyboardShortcutDesc', undefined, 'Speed up your workflow'),
      icon: Keyboard,
      completed: checklist.keyboard_shortcut_used,
      onClick: () =>
        openInformation({
          title: getMessage('keyboardShortcuts', undefined, 'Keyboard Shortcuts'),
          description: getMessage(
            'keyboardShortcutInfo',
            undefined,
            'Use //j to quickly insert blocks.'
          ),
          gifUrl:
            'https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//shortchut_demo.gif',
          actionText: getMessage('tryItNow', undefined, 'Try it now!'),
          onAction: openQuickSelector,
        })
    }
  ], [
    checklist.first_template_used,
    checklist.first_template_created,
    checklist.first_block_created,
    checklist.keyboard_shortcut_used,
    openInformation,
    onCreateTemplate,
    onCreateBlock,
    openQuickSelector,
    PinnedFoldersContent
  ]);

  // Early return if dismissed
  if (checklist.is_dismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        'jd-bg-gradient-to-br jd-rounded-lg jd-border jd-p-4 jd-mx-2 jd-my-3',
        isDarkMode
          ? 'jd-from-primary/20 jd-to-secondary/20 jd-border-primary/40'
          : 'jd-from-primary/10 jd-to-secondary/10 jd-border-primary/20'
      )}
    >
      {/* Header */}
      <div className="jd-flex jd-items-center jd-justify-between jd-mb-3">
        <div className="jd-flex jd-items-center jd-gap-2">
          <div className="jd-w-8 jd-h-8 jd-bg-primary jd-rounded-full jd-flex jd-items-center jd-justify-center">
            <span className="jd-text-white jd-font-bold jd-text-sm">
              {checklist.completed_count}
            </span>
          </div>
          <div>
            <h3 className="jd-font-semibold jd-text-foreground jd-text-sm">
              {getMessage('getStarted', undefined, 'Get Started')}
            </h3>
            <p className="jd-text-xs jd-text-muted-foreground">
              {checklist.progress} {getMessage('completed', undefined, 'completed')}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="jd-text-muted-foreground hover:jd-text-foreground"
          disabled={isLoading}
        >
          <X className="jd-h-4 jd-w-4" />
        </Button>
      </div>

      {/* Progress Bar */}
      <ProgressBar percentage={progressPercentage} isDarkMode={isDarkMode} />

      {/* Action Items */}
      <div className="jd-space-y-2">
        {actions.map((action) => (
          <ActionItem
            key={action.key}
            action={action}
            isDarkMode={isDarkMode}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Completion Badge */}
      {checklist.is_complete && <CompletionBadge isDarkMode={isDarkMode} />}
    </div>
  );
});

OnboardingChecklist.displayName = 'OnboardingChecklist';