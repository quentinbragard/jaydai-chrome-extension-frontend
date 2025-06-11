// src/components/dialogs/prompts/CreateTemplateDialog/index.tsx
import React, { useMemo } from 'react';
import { getMessage } from '@/core/utils/i18n';
import { useCreateTemplateDialog } from '@/hooks/dialogs/useCreateTemplateDialog';
import { TemplateEditorDialog } from '../TemplateEditorDialog';
import { BasicInfoForm } from './BasicInfoForm';
import { FolderData } from '@/utils/prompts/templateUtils';

// Helper function to process user folders
function processUserFolders(userFolders: any[]): FolderData[] {
  if (!userFolders || !Array.isArray(userFolders)) {
    return [];
  }

  const flattenFolderHierarchy = (
    folders: any[],
    path = '',
    result: FolderData[] = []
  ): FolderData[] => {
    folders.forEach(folder => {
      if (!folder || typeof folder.id !== 'number' || !folder.name) return;
      const folderPath = path ? `${path} / ${folder.name}` : folder.name;
      result.push({ id: folder.id, name: folder.name, fullPath: folderPath });
      if (folder.Folders && Array.isArray(folder.Folders) && folder.Folders.length > 0) {
        flattenFolderHierarchy(folder.Folders, folderPath, result);
      }
    });
    return result;
  };

  return flattenFolderHierarchy(userFolders);
}

export const CreateTemplateDialog: React.FC = () => {
  const hook = useCreateTemplateDialog();
  
  // Process user folders using useMemo for performance
  const userFoldersList = useMemo(() => {
    return processUserFolders(hook.data?.userFolders || []);
  }, [hook.data?.userFolders]);

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
      
      // Actions
      setContent={hook.setContent}
      setActiveTab={hook.setActiveTab}
      handleComplete={hook.handleComplete}
      handleClose={hook.handleClose}
      
      // Metadata actions
      updateSingleMetadataValue={hook.updateSingleMetadataValue}
      updateCustomMetadataValue={hook.updateCustomMetadataValue}
      addMultipleMetadataItem={hook.addMultipleMetadataItem}
      removeMultipleMetadataItem={hook.removeMultipleMetadataItem}
      updateMultipleMetadataItem={hook.updateMultipleMetadataItem}
      reorderMultipleMetadataItems={hook.reorderMultipleMetadataItems}
      addSecondaryMetadataType={hook.addSecondaryMetadataType}
      removeSecondaryMetadataType={hook.removeSecondaryMetadataType}
      
      // UI state
      expandedMetadata={hook.expandedMetadata}
      setExpandedMetadata={hook.setExpandedMetadata}
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