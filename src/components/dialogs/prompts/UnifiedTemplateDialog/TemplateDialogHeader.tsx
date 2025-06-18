// src/components/dialogs/prompts/UnifiedTemplateDialog/TemplateDialogHeader.tsx
import React from 'react';
import { useTemplateEditor } from '@/contexts/TemplateEditorContext';
import { BasicInfoForm } from './BasicInfoForm';

export const TemplateDialogHeader: React.FC = () => {
  const { state } = useTemplateEditor();

  // Only show the form for create mode
  if (state.dialog.mode !== 'create') return null;

  return (
    <div className="jd-flex-shrink-0">
      <BasicInfoForm />
    </div>
  );
};