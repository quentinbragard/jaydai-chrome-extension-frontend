import React from 'react';
import { getMessage } from '@/core/utils/i18n';
import { useCreateTemplateDialog } from '@/hooks/dialogs/useCreateTemplateDialog';
import { TemplateEditorDialog } from '../TemplateEditorDialog';
import { BasicInfoForm } from './BasicInfoForm';

export const CreateTemplateDialog: React.FC = () => {
  const {
    isOpen,
    error,
    metadata: rawMetadata,
    isProcessing,
    name,
    setName,
    description,
    setDescription,
    content,
    setContent,
    selectedFolderId,
    handleFolderSelect,
    userFoldersList,
    validationErrors,
    handleUpdateMetadata,
    handleComplete,
    handleClose,
  } = useCreateTemplateDialog();

  const infoForm = (
    <BasicInfoForm
      name={name}
      setName={setName}
      description={description}
      setDescription={setDescription}
      selectedFolderId={selectedFolderId}
      handleFolderSelect={handleFolderSelect}
      userFoldersList={userFoldersList}
      validationErrors={validationErrors}
    />
  );

  const onComplete = (finalContent: string) => {
    // Create dialog saves original content and metadata
    handleComplete(content, rawMetadata);
  };

  return (
    <TemplateEditorDialog
      isOpen={isOpen}
      error={error}
      rawMetadata={rawMetadata}
      isProcessing={isProcessing}
      content={content}
      setContent={setContent}
      onUpdateMetadata={handleUpdateMetadata}
      onComplete={onComplete}
      onClose={handleClose}
      dialogTitle={getMessage('CreateTemplateDialog', undefined, 'Prompt Block Editor')}
      dialogDescription={getMessage('CreateTemplateDialogDescription', undefined, 'Build your prompt using blocks')}
      mode="create"
      infoForm={infoForm}
    />
  );
};
