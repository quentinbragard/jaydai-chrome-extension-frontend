// src/components/onboarding/KeyboardShortcutDialog.tsx
import React from 'react';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { getMessage } from '@/core/utils/i18n';
import { Keyboard, Zap } from 'lucide-react';

interface KeyboardShortcutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShortcutUsed?: () => void;
}

export const KeyboardShortcutDialog: React.FC<KeyboardShortcutDialogProps> = ({
  open,
  onOpenChange,
  onShortcutUsed
}) => {
  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={getMessage('keyboardShortcuts', undefined, 'Keyboard Shortcuts')}
      description={getMessage('keyboardShortcutsDesc', undefined, 'Speed up your workflow with these shortcuts')}
      className="jd-max-w-lg"
    >
      <div className="jd-space-y-6">
        {/* Main shortcut explanation */}
        <div className="jd-bg-blue-50 jd-dark:jd-bg-blue-950/30 jd-p-4 jd-rounded-lg jd-border jd-border-blue-200 jd-dark:jd-border-blue-800">
          <div className="jd-flex jd-items-center jd-gap-3 jd-mb-3">
            <div className="jd-w-8 jd-h-8 jd-bg-blue-500 jd-rounded-full jd-flex jd-items-center jd-justify-center">
              <Keyboard className="jd-h-4 jd-w-4 jd-text-white" />
            </div>
            <h3 className="jd-font-semibold jd-text-foreground">
              {getMessage('quickBlockInsertion', undefined, 'Quick Block Insertion')}
            </h3>
          </div>
          
          <div className="jd-space-y-3">
            <div className="jd-flex jd-items-center jd-gap-2">
              <kbd className="jd-px-3 jd-py-1 jd-bg-gray-100 jd-dark:jd-bg-gray-800 jd-rounded jd-text-sm jd-font-mono jd-border jd-shadow-sm">
                //j
              </kbd>
              <span className="jd-text-sm jd-text-muted-foreground">
                {getMessage('typeToOpenSelector', undefined, 'Type to open block selector')}
              </span>
            </div>
            
            <p className="jd-text-sm jd-text-muted-foreground">
              {getMessage('shortcutDescription', undefined, 'Type //j in any chat input to quickly insert blocks and templates. It\'s like having a magic wand for your prompts!')}
            </p>
          </div>
        </div>

        {/* Demo GIF */}
        <div className="jd-rounded-lg jd-overflow-hidden jd-border jd-shadow-sm">
          <img
            src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//shortchut_demo.gif"
            alt={getMessage('keyboardShortcutDemo', undefined, 'Keyboard shortcut demonstration')}
            className="jd-w-full jd-h-auto"
            onLoad={() => {
              // Mark as used when GIF loads (user has seen the demonstration)
              if (onShortcutUsed) {
                onShortcutUsed();
              }
            }}
          />
        </div>

        {/* Call to action */}
        <div className="jd-bg-gradient-to-r jd-from-green-50 jd-to-emerald-50 jd-dark:jd-from-green-950/30 jd-dark:jd-to-emerald-950/30 jd-p-4 jd-rounded-lg jd-border jd-border-green-200 jd-dark:jd-border-green-800">
          <div className="jd-flex jd-items-center jd-gap-2 jd-mb-2">
            <Zap className="jd-h-5 jd-w-5 jd-text-green-600" />
            <p className="jd-text-sm jd-text-green-700 jd-dark:jd-text-green-400 jd-font-medium">
              {getMessage('tryItNow', undefined, 'Try it now!')}
            </p>
          </div>
          <p className="jd-text-sm jd-text-green-600 jd-dark:jd-text-green-300">
            {getMessage('tryShortcutInstructions', undefined, 'Close this dialog and type //j in any chat input to see the magic happen.')}
          </p>
        </div>
      </div>
    </BaseDialog>
  );
};