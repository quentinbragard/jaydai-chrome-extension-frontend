// src/components/dialogs/prompts/UnifiedTemplateDialog/index.tsx
import React from 'react';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useTemplateEditor } from '@/contexts/TemplateEditorContext';
import { TemplateDialogHeader } from './TemplateDialogHeader';
import { TemplateDialogContent } from './TemplateDialogContent';
import { TemplateDialogFooter } from './TemplateDialogFooter';

export const UnifiedTemplateDialog: React.FC = () => {
  const { state, actions, computed } = useTemplateEditor();

  if (!state.dialog.isOpen) return null;

  // Error state
  if (state.dialog.error && !state.dialog.isProcessing) {
    return (
      <BaseDialog
        open={true}
        onOpenChange={() => actions.closeDialog()}
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
      onOpenChange={() => actions.closeDialog()}
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
