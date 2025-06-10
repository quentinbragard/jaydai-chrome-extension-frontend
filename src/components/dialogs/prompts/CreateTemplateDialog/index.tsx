// src/components/dialogs/prompts/CreateTemplateDialog/index.tsx - Updated
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { BasicEditor, AdvancedEditor } from '../editors';
import { BasicInfoForm } from './BasicInfoForm';
import { useCreateTemplateDialog } from '@/hooks/dialogs/useCreateTemplateDialog';
import { useBlockManager } from '@/hooks/prompts/editors/useBlockManager';
import { PromptMetadata, DEFAULT_METADATA } from '@/types/prompts/metadata';

export const CreateTemplateDialog: React.FC = () => {
  const dialog = useCreateTemplateDialog();
  
  // Use the block manager hook
  const {
    isLoading: blocksLoading,
    availableMetadataBlocks,
    availableBlocksByType,
    blockContentCache,
    resolveMetadataToContent,
    buildFinalPromptContent,
    buildFinalPromptHtml,
    addNewBlock
  } = useBlockManager();

  // Resolve metadata to get actual content from block IDs
  const resolvedMetadata = useMemo(() => {
    if (blocksLoading) return DEFAULT_METADATA;
    return resolveMetadataToContent(dialog.metadata);
  }, [dialog.metadata, resolveMetadataToContent, blocksLoading]);

  // Build final prompt content that will be consistent across editors
  const finalPromptContent = useMemo(() => {
    if (blocksLoading) return '';
    return buildFinalPromptContent(dialog.metadata, dialog.content);
  }, [dialog.metadata, dialog.content, buildFinalPromptContent, blocksLoading]);

  // Handle block saves
  const handleBlockSaved = (newBlock: any) => {
    addNewBlock(newBlock);
  };

  // Handle save with resolved content
  const handleSaveWithResolvedContent = () => {
    // The dialog's handleSave should use the final prompt content
    dialog.handleSave(finalPromptContent);
  };

  if (!dialog.isOpen) return null;

  const isLoading = dialog.isSubmitting || blocksLoading;

  return (
    <BaseDialog
      open={dialog.isOpen}
      onOpenChange={open => {
        if (!open) dialog.handleClose();
      }}
      title={dialog.dialogTitle}
      className="jd-max-w-4xl jd-h-[80vh]"
    >
      <div className="jd-flex jd-flex-col jd-h-full jd-gap-4">
        <BasicInfoForm
          name={dialog.name}
          setName={dialog.setName}
          description={dialog.description}
          setDescription={dialog.setDescription}
          selectedFolderId={dialog.selectedFolderId}
          handleFolderSelect={dialog.handleFolderSelect}
          userFoldersList={dialog.userFoldersList}
          validationErrors={dialog.validationErrors}
        />

        {isLoading ? (
          <div className="jd-flex jd-items-center jd-justify-center jd-h-64">
            <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full"></div>
            <span className="jd-ml-3 jd-text-gray-600">
              Loading {blocksLoading ? 'blocks...' : 'template...'}
            </span>
          </div>
        ) : (
          <Tabs
            value={dialog.activeTab}
            onValueChange={value => dialog.setActiveTab(value as 'basic' | 'advanced')}
            className="jd-flex-1 jd-flex jd-flex-col"
          >
            <TabsList className="jd-grid jd-w-full jd-grid-cols-2">
              <TabsTrigger value="basic">Basic Editor</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="jd-flex-1 jd-overflow-y-auto jd-mt-4">
              <BasicEditor 
                content={dialog.content}
                metadata={resolvedMetadata} // Pass resolved metadata with actual content
                onContentChange={dialog.setContent}
                onUpdateMetadata={dialog.handleUpdateMetadata} // This still works with block IDs
                mode="create"
                isProcessing={false}
                finalPromptContent={finalPromptContent}
              />
            </TabsContent>

            <TabsContent value="advanced" className="jd-flex-1 jd-overflow-y-auto jd-mt-4">
              <AdvancedEditor
                content={dialog.content}
                metadata={dialog.metadata} // Pass raw metadata with block IDs
                onContentChange={dialog.setContent}
                onUpdateMetadata={dialog.handleUpdateMetadata}
                isProcessing={false}
                // Pass block management props
                availableMetadataBlocks={availableMetadataBlocks}
                availableBlocksByType={availableBlocksByType}
                blockContentCache={blockContentCache}
                onBlockSaved={handleBlockSaved}
                // Pass resolved metadata for preview
                resolvedMetadata={resolvedMetadata}
                finalPromptContent={finalPromptContent}
              />
            </TabsContent>
          </Tabs>
        )}

        <div className="jd-flex jd-justify-end jd-gap-2 jd-pt-4 jd-border-t">
          <Button variant="outline" onClick={dialog.handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSaveWithResolvedContent} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="jd-h-4 jd-w-4 jd-border-2 jd-border-current jd-border-t-transparent jd-animate-spin jd-rounded-full jd-inline-block jd-mr-2"></div>
                Create
              </>
            ) : (
              dialog.dialogTitle
            )}
          </Button>
        </div>

        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="jd-text-xs jd-text-gray-500 jd-mt-2">
            <div>Final content length: {finalPromptContent.length} chars</div>
            <div>Raw metadata: {JSON.stringify(dialog.metadata).substring(0, 100)}...</div>
            <div>Resolved metadata: {JSON.stringify(resolvedMetadata.values).substring(0, 100)}...</div>
          </div>
        )}
      </div>
    </BaseDialog>
  );
};