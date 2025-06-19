// src/components/dialogs/prompts/CreateTemplateDialog/index.tsx - Updated
import React, { useMemo } from 'react';
import { getMessage } from '@/core/utils/i18n';
import { useCreateTemplateDialog } from '@/hooks/dialogs/useCreateTemplateDialog';
import { TemplateEditorDialog } from '../TemplateEditorDialog';
import { BasicInfoForm } from './BasicInfoForm';
import { processUserFolders } from '@/utils/prompts/templateUtils';
import { useUserFolders } from '@/hooks/prompts';

export const CreateTemplateDialog: React.FC = () => {
  const hook = useCreateTemplateDialog();
  const { data: fetchedUserFolders = [] } = useUserFolders();

  // Choose folders from dialog data if available, otherwise fallback to fetched data
  const foldersSource = hook.data?.userFolders && hook.data.userFolders.length > 0
    ? hook.data.userFolders
    : fetchedUserFolders;

  // Process user folders using useMemo for performance
  const userFoldersList = useMemo(() => {
    return processUserFolders(foldersSource);
  }, [foldersSource]);

  const infoForm = hook.isOpen && (
    <BasicInfoForm
      name={hook.name}
      setName={hook.setName}
      description={hook.description}
      setDescription={hook.setDescription}
      selectedFolderId={hook.selectedFolderId}
      handleFolderSelect={hook.setSelectedFolderId}
      userFoldersList={userFoldersList}
      validationErrors={hook.validationErrors}
    />
  );

  return (
    <TemplateEditorDialog
      // State
      isOpen={hook.isOpen}
      error={hook.error}
      metadata={hook.metadata}
      isProcessing={hook.isProcessing}
      content={hook.content}
      activeTab={hook.activeTab}
      isSubmitting={hook.isSubmitting}
      
      // **NEW: Final content state**
      finalPromptContent={hook.finalPromptContent}
      hasUnsavedFinalChanges={hook.hasUnsavedFinalChanges}
      modifiedBlocks={hook.modifiedBlocks}
      modifiedMetadata={hook.modifiedMetadata}
      blockRanges={hook.blockRanges}
      
      // Actions
      setContent={hook.setContent}
      setActiveTab={hook.setActiveTab}
      handleComplete={hook.handleComplete}
      handleClose={hook.handleClose}
      
      // **NEW: Final content actions**
      setFinalPromptContent={hook.setFinalPromptContent}
      applyFinalContentChanges={hook.applyFinalContentChanges}
      discardFinalContentChanges={hook.discardFinalContentChanges}
      updateBlockContent={hook.updateBlockContent}
      
      // Metadata update
      setMetadata={hook.setMetadata}
      
      // UI state
      expandedMetadata={hook.expandedMetadata}
      toggleExpandedMetadata={hook.toggleExpandedMetadata}
      activeSecondaryMetadata={hook.activeSecondaryMetadata}
      metadataCollapsed={hook.metadataCollapsed}
      setMetadataCollapsed={hook.setMetadataCollapsed}
      secondaryMetadataCollapsed={hook.secondaryMetadataCollapsed}
      setSecondaryMetadataCollapsed={hook.setSecondaryMetadataCollapsed}
      customValues={hook.customValues}
      
      // Config
      dialogTitle={hook.dialogTitle}
      dialogDescription={getMessage('CreateTemplateDialogDescription', undefined, 'Build your prompt using metadata and content')}
      mode={hook.isEditMode ? 'edit' : 'create'}
      infoForm={infoForm}
    />
  );
};