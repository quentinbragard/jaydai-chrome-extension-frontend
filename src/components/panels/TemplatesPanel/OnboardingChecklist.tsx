// src/components/panels/TemplatesPanel/OnboardingChecklist.tsx
import React from 'react';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, X, Play, FileText, Blocks, Keyboard } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';
import { cn } from '@/core/utils/classNames';
import { useDialogActions } from '@/hooks/dialogs/useDialogActions';
import { useAllPinnedFolders } from '@/hooks/prompts';
import { useOrganizations } from '@/hooks/organizations';
import { Template } from '@/types/prompts/templates';
import { FolderItem } from '@/components/prompts/folders/FolderItem';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { slashCommandService } from '@/services/ui/SlashCommandService';
import { getCursorCoordinates, getCursorTextPosition } from '@/services/ui/slashUtils';

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

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
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

  const { allPinnedFolders, allPinnedFolderIds } = useAllPinnedFolders();
  const { data: organizations = [] } = useOrganizations();
  const isDarkMode = useThemeDetector();

  const PinnedFoldersContent: React.FC = () => {
    const { dialogProps } = useDialog(DIALOG_TYPES.INFORMATION);
    const [expandedFolders, setExpandedFolders] = React.useState<Set<number>>(new Set());

    const toggleExpanded = (id: number) => {
      setExpandedFolders(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    };

    const handleUseTemplate = (template: Template) => {
      dialogProps.onOpenChange(false);
      onSelectTemplate(template);
    };

    return (
      <>
        <p className="jd-text-sm jd-mb-2">
          {getMessage('searchTemplatesHint', undefined, 'You can search among hundreds of templates with the search bar. We recommend starting with one of these folders.')}
        </p>
        <div className="jd-max-h-72 jd-overflow-y-auto jd-space-y-1 jd-px-2">
          {allPinnedFolders.map(folder => (
            <FolderItem
              key={`onboard-folder-${folder.id}`}
              folder={folder}
              type={folder.folderType as any}
              enableNavigation={false}
              onToggleExpand={toggleExpanded}
              isExpanded={expandedFolders.has(folder.id)}
              onUseTemplate={handleUseTemplate}
              organizations={organizations}
              showEditControls={false}
              showDeleteControls={false}
              showPinControls={false}
              pinnedFolderIds={allPinnedFolderIds}
            />
          ))}
        </div>
      </>
    );
  };

  const openQuickSelector = () => {
    try {
      const service: any = slashCommandService as any;
      const target = service.inputEl as HTMLElement | null;
      if (target) {
        const position = getCursorCoordinates(target);
        const cursorPos = getCursorTextPosition(target);
        service.quickSelector.open(position, target, cursorPos, 0);
      }
    } catch (error) {
      console.error('Failed to open quick selector', error);
    }
  };

  const actions = [
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
          gifUrl: 'https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//template_demo.gif',
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
  ];

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
      <div
        className={cn(
          'jd-w-full jd-rounded-full jd-h-2 jd-mb-4',
          isDarkMode ? 'jd-bg-secondary/40' : 'jd-bg-secondary/20'
        )}
      >
        <div
          className="jd-bg-primary jd-h-2 jd-rounded-full jd-transition-all jd-duration-300"
          style={{ width: `${(checklist.completed_count / checklist.total_count) * 100}%` }}
        />
      </div>

      {/* Action Items */}
      <div className="jd-space-y-2">
        {actions.map((action) => {
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
        })}
      </div>

      {checklist.is_complete && (
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
      )}
    </div>
  );
};