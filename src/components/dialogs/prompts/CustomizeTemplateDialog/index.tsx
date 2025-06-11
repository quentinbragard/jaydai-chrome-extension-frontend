
// src/components/dialogs/prompts/CustomizeTemplateDialog/index.tsx
import React from 'react';
import { getMessage } from '@/core/utils/i18n';
import { useCustomizeTemplateDialog } from '@/hooks/dialogs/useCustomizeTemplateDialog';
import { TemplateEditorDialog } from '../TemplateEditorDialog';

export const CustomizeTemplateDialog: React.FC = () => {
  const hook = useCustomizeTemplateDialog();

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
      
      // Metadata update
      setMetadata={hook.setMetadata}
      
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
      dialogTitle={getMessage('CustomizeTemplateDialog', undefined, 'Customize Template')}
      dialogDescription={getMessage('CustomizeTemplateDialogDescription', undefined, 'Customize your prompt template')}
      mode="customize"
    />
  );
};