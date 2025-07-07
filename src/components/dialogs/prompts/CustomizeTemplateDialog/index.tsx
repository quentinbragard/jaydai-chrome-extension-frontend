// src/components/dialogs/prompts/CustomizeTemplateDialog/index.tsx - Updated
import React, { useMemo } from 'react';
import { getMessage } from '@/core/utils/i18n';
import { useCustomizeTemplateDialog } from '@/hooks/dialogs/useCustomizeTemplateDialog';
import { TemplateEditorDialog } from '../TemplateEditorDialog';

import { useOrganizations, useOrganizationById } from '@/hooks/organizations';
import { OrganizationBanner } from '@/components/organizations';


export const CustomizeTemplateDialog: React.FC = () => {
  const hook = useCustomizeTemplateDialog();
  const { data: organizations = [] } = useOrganizations();
  const { data: orgById } = useOrganizationById(
    (hook.data as any)?.organization?.id || (hook.data as any)?.organization_id
  );

  const resolvedOrg = useMemo(() => {
    if (!hook.data) return undefined;
    return (
      (hook.data as any).organization ||
      orgById ||
      organizations.find(o => o.id === (hook.data as any).organization_id)
    );
  }, [hook.data, orgById, organizations]);

  const dialogHeader = useMemo(() => {
    if (hook.data?.type === 'organization' && resolvedOrg) {
      return <OrganizationBanner organization={resolvedOrg} />;
    }
    return undefined;
  }, [hook.data, resolvedOrg]);


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
      initialMetadata={hook.initialMetadata}
      resetMetadata={hook.resetMetadata}
      
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
      dialogTitle={ hook.data?.title || 'Template'}
      dialogDescription={getMessage('customizeTemplateDesc', undefined, 'Customize the template by filling in the placeholders.')}
      mode="customize"
      header={dialogHeader}
    />
  );
};