import React from 'react';
import { PlusCircle, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMessage } from '@/core/utils/i18n';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';

const TEMPLATES_GIF = 'https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//templates_demo.gif';
const BLOCKS_GIF = 'https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//blocks_demo.gif';

export const OnboardingChecklist: React.FC = () => {
  const openInformationDialog = (
    options: {
      title: string;
      description: string;
      imageUrl: string;
      actionText: string;
      onAction: () => void;
    }
  ) => {
    window.dialogManager?.openDialog(DIALOG_TYPES.INFORMATION, options);
  };

  const handleCreateTemplate = () => {
    openInformationDialog({
      title: getMessage('createTemplate', undefined, 'Create a Template'),
      description: getMessage('createTemplateInfo', undefined, 'Templates help you reuse prompts.'),
      imageUrl: TEMPLATES_GIF,
      actionText: getMessage('createTemplate', undefined, 'Create Template'),
      onAction: () => window.dialogManager?.openDialog(DIALOG_TYPES.CREATE_TEMPLATE)
    });
  };

  const handleCreateBlock = () => {
    openInformationDialog({
      title: getMessage('createBlock', undefined, 'Create a Block'),
      description: getMessage('createBlockInfo', undefined, 'Blocks are reusable parts of a template.'),
      imageUrl: BLOCKS_GIF,
      actionText: getMessage('createBlock', undefined, 'Create Block'),
      onAction: () => window.dialogManager?.openDialog('createBlock')
    });
  };

  const handleKeyboardShortcut = () => {
    openInformationDialog({
      title: getMessage('useShortcut', undefined, 'Keyboard Shortcut'),
      description: getMessage('shortcutInfo', undefined, 'Use the shortcut to open the quick block selector.'),
      imageUrl: BLOCKS_GIF,
      actionText: getMessage('openQuickBlockSelector', undefined, 'Open Quick Block Selector'),
      onAction: () => {
        if ((window as any).quickBlockSelector?.open) {
          (window as any).quickBlockSelector.open();
        }
      }
    });
  };

  return (
    <div className="jd-space-y-2">
      <Button variant="outline" size="sm" onClick={handleCreateTemplate} className="jd-w-full jd-flex jd-justify-start">
        <PlusCircle className="jd-h-4 jd-w-4 jd-mr-2" />
        {getMessage('createTemplate', undefined, 'Create a template')}
      </Button>
      <Button variant="outline" size="sm" onClick={handleCreateBlock} className="jd-w-full jd-flex jd-justify-start">
        <PlusCircle className="jd-h-4 jd-w-4 jd-mr-2" />
        {getMessage('createBlock', undefined, 'Create a block')}
      </Button>
      <Button variant="outline" size="sm" onClick={handleKeyboardShortcut} className="jd-w-full jd-flex jd-justify-start">
        <Keyboard className="jd-h-4 jd-w-4 jd-mr-2" />
        {getMessage('keyboardShortcut', undefined, 'Keyboard shortcut')}
      </Button>
    </div>
  );
};

export default OnboardingChecklist;
