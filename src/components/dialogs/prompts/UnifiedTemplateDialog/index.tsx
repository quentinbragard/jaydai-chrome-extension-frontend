// src/components/dialogs/prompts/UnifiedTemplateDialog/index.tsx
import React, { useEffect } from 'react';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useTemplateEditor } from '@/contexts/TemplateEditorContext';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { TemplateDialogHeader } from './TemplateDialogHeader';
import { TemplateDialogContent } from './TemplateDialogContent';
import { TemplateDialogFooter } from './TemplateDialogFooter';

export const UnifiedTemplateDialog: React.FC = () => {
  const { state, actions, computed } = useTemplateEditor();
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.UNIFIED_TEMPLATE);

  useEffect(() => {
    if (isOpen) {
      actions.openDialog((data as any)?.mode || 'create', data);
    } else if (state.dialog.isOpen) {
      actions.closeDialog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      actions.closeDialog();
    }
    dialogProps.onOpenChange(open);
  };

  // Error state
  if (state.dialog.error && !state.dialog.isProcessing) {
    return (
      <BaseDialog
        open={true}
        onOpenChange={handleOpenChange}
        title={computed.dialogTitle}
        className="jd-max-w-4xl jd-h-[80vh]"
      >
        <div className="jd-flex jd-flex-col jd-items-center jd-justify-center jd-h-64">
          <Alert variant="destructive" className="jd-mb-4 jd-max-w-md">
            <AlertTriangle className="jd-h-4 jd-w-4" />
            <AlertDescription>{state.dialog.error}</AlertDescription>
          </Alert>
          <button onClick={actions.closeDialog} className="jd-btn jd-btn-outline">
            Close
          </button>
        </div>
      </BaseDialog>
    );
  }

  return (
    <BaseDialog
      open={true}
      onOpenChange={handleOpenChange}
      title={computed.dialogTitle}
      description={computed.dialogDescription}
      className="jd-max-w-6xl jd-h-[100vh]"
    >
      <div className="jd-flex jd-flex-col jd-h-full">
        <TemplateDialogHeader />
        <TemplateDialogContent />
        <TemplateDialogFooter />
      </div>
    </BaseDialog>
  );
};
