// src/components/dialogs/prompts/CustomizeTemplateDialog/index.tsx

import React from 'react';
import { getMessage } from '@/core/utils/i18n';
import { useCustomizeTemplateDialog } from '@/hooks/dialogs/useCustomizeTemplateDialog';
import { TemplateEditorDialog } from '../TemplateEditorDialog';

export const CustomizeTemplateDialog: React.FC = () => {
  const {
    isOpen,
    error,
    metadata,
    isProcessing,
    content,
    setContent,
    // ✅ Use unified metadata handlers
    handleUpdateMetadata,
    handleComplete,
    handleClose,
  } = useCustomizeTemplateDialog();

  return (
    <TemplateEditorDialog
      isOpen={isOpen}
      error={error}
      metadata={metadata}
      isProcessing={isProcessing}
      content={content}
      setContent={setContent}
      onMetadataChange={handleUpdateMetadata}
      onComplete={handleComplete}
      onClose={handleClose}
      dialogTitle={getMessage('CustomizeTemplateDialog', undefined, 'Prompt Block Editor')}
      dialogDescription={getMessage('CustomizeTemplateDialogDescription', undefined, 'Build your prompt using blocks')}
      mode="customize"
    />
  );
};