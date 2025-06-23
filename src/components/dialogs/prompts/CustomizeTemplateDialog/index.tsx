// src/components/dialogs/prompts/CustomizeTemplateDialog/index.tsx - Updated
import React, { useMemo } from 'react';
import { getMessage } from '@/core/utils/i18n';
import { useCustomizeTemplateDialog } from '@/hooks/dialogs/useCustomizeTemplateDialog';
import { TemplateEditorDialog } from '../TemplateEditorDialog';
import { OrganizationImage } from '@/components/organizations';
import { Alert } from '@/components/ui/alert';

export const CustomizeTemplateDialog: React.FC = () => {
  const hook = useCustomizeTemplateDialog();

  const infoForm = useMemo(() => {
    if (hook.data?.type === 'organization') {
      const orgName = hook.data.organization?.name as string | undefined;
      const imageUrl = hook.data.organization?.image_url || hook.data.image_url;
      const text = orgName
        ? getMessage('organizationTemplateNoticeWithName', orgName, `Template provided by ${orgName}`)
        : getMessage('organizationTemplateNotice', undefined, 'Template provided by your organization');

      return (
        <Alert className="jd-flex jd-items-center jd-gap-2 jd-mb-4 jd-bg-muted/60">
          {imageUrl && (
            <OrganizationImage imageUrl={imageUrl} organizationName={orgName || ''} size="sm" className="jd-mr-2" />
          )}
          <span className="jd-text-sm">{text}</span>
        </Alert>
      );
    }
    return null;
  }, [hook.data]);

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
      dialogTitle={getMessage('CustomizeTemplateDialog', undefined, 'Customize Template')}
      dialogDescription={getMessage('CustomizeTemplateDialogDescription', undefined, 'Customize your prompt template')}
      mode="customize"
      infoForm={infoForm}
    />
  );
};