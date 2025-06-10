// src/components/dialogs/prompts/CreateTemplateDialog/index.tsx - Updated
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { getMessage } from '@/core/utils/i18n';
import { BasicInfoForm } from './BasicInfoForm';
import { BasicEditor, AdvancedEditor } from '../editors';
import { useCreateTemplateDialog } from '@/hooks/dialogs/useCreateTemplateDialog';
import { useBlockManager } from '@/hooks/prompts/editors/useBlockManager';
import { PromptMetadata, DEFAULT_METADATA } from '@/types/prompts/metadata';

/**
 * Dialog for editing template content using blocks with Basic/Advanced modes
 * Now with centralized block management and consistent content resolution
 */
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
    metadata,
    setMetadata,
    selectedFolderId,
    handleFolderSelect,
    userFoldersList,
    validationErrors,
    handleUpdateMetadata,
    handleComplete,
    handleClose,
  } = useCreateTemplateDialog();

  // Use the block manager hook
  const {
    isLoading: blocksLoading,
    availableMetadataBlocks,
    availableBlocksByType,
    blockContentCache,
    resolveMetadataToContent,
    buildFinalPromptContent
  } = useBlockManager();

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  
  // Resolve metadata to get actual content from block IDs
  const resolvedMetadata = useMemo(() => {
    if (!rawMetadata || blocksLoading) return DEFAULT_METADATA;
    return resolveMetadataToContent(rawMetadata);
  }, [rawMetadata, resolveMetadataToContent, blocksLoading]);

  // Build final prompt content that will be consistent across editors
  const finalPromptContent = useMemo(() => {
    if (blocksLoading) return '';
    return buildFinalPromptContent(rawMetadata || DEFAULT_METADATA, content);
  }, [rawMetadata, content, buildFinalPromptContent, blocksLoading]);

  // Handle completion with resolved content
  const handleCompleteWithResolvedContent = () => {
    handleComplete(content, rawMetadata);
  };

  // Handle metadata updates (these still work with block IDs)
  const handleMetadataUpdate = (newMetadata: PromptMetadata) => {
    handleUpdateMetadata(newMetadata);
  };



  if (!isOpen) return null;

  if (error && !isProcessing) {
    return (
      <BaseDialog
        open={isOpen}
        onOpenChange={(open: boolean) => {
          if (!open) handleClose();
        }}
        title={getMessage('CreateTemplateDialog', undefined, 'Prompt Block Editor')}
        className="jd-max-w-4xl jd-h-[80vh]"
      >
        <div className="jd-flex jd-flex-col jd-items-center jd-justify-center jd-h-64">
          <Alert variant="destructive" className="jd-mb-4 jd-max-w-md">
            <AlertTriangle className="jd-h-4 jd-w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleClose} variant="outline">
            {getMessage('close')}
          </Button>
        </div>
      </BaseDialog>
    );
  }

  const isLoading = isProcessing || blocksLoading;

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) handleClose();
      }}
      title={getMessage('CreateTemplateDialog', undefined, 'Prompt Block Editor')}
      description={getMessage('CreateTemplateDialogDescription', undefined, 'Build your prompt using blocks')}
      className="jd-max-w-6xl jd-h-[100vh]"
    >
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
      <div className="jd-flex jd-flex-col jd-h-full jd-gap-4">
        {error && (
          <Alert variant="destructive" className="jd-mb-2">
            <AlertTriangle className="jd-h-4 jd-w-4 jd-mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="jd-flex jd-items-center jd-justify-center jd-h-64">
            <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full"></div>
            <span className="jd-ml-3 jd-text-gray-600">
              {getMessage('loadingTemplate')} {blocksLoading && '& blocks...'}
            </span>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={value => setActiveTab(value as 'basic' | 'advanced')}
            className="jd-flex-1 jd-flex jd-flex-col"
          >
            <TabsList className="jd-grid jd-w-full jd-grid-cols-2 jd-mb-4">
              <TabsTrigger value="basic">{getMessage('basic')}</TabsTrigger>
              <TabsTrigger value="advanced">{getMessage('advanced')}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="jd-flex-1 jd-overflow-y-auto">
              <BasicEditor
                content={content}
                metadata={resolvedMetadata} // Pass resolved metadata with actual content
                onContentChange={setContent}
                onUpdateMetadata={handleMetadataUpdate} // This still works with block IDs
                mode="create"
                isProcessing={false}
                // Pass additional props for consistency
                finalPromptContent={finalPromptContent}
              />
            </TabsContent>

            <TabsContent value="advanced" className="jd-flex-1 jd-overflow-y-auto">
              <AdvancedEditor
                content={content}
                metadata={resolvedMetadata || DEFAULT_METADATA} // Pass raw metadata with block IDs
                onContentChange={setContent}
                onUpdateMetadata={handleMetadataUpdate}
                isProcessing={false}
                // Pass block management props
                availableMetadataBlocks={availableMetadataBlocks}
                availableBlocksByType={availableBlocksByType}
                blockContentCache={blockContentCache}
                // Pass resolved metadata for preview
                resolvedMetadata={resolvedMetadata}
                finalPromptContent={finalPromptContent}
              />
            </TabsContent>
          </Tabs>
        )}

        <div className="jd-flex jd-justify-end jd-gap-2 jd-pt-4 jd-border-t">
          <Button variant="outline" onClick={handleClose}>
            {getMessage('cancel', undefined, 'Cancel')}
          </Button>
          <Button 
            onClick={handleCompleteWithResolvedContent} 
            disabled={isLoading}
          >
            {getMessage('useTemplate', undefined, 'Use Template')}
          </Button>
        </div>

        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="jd-text-xs jd-text-gray-500 jd-mt-2">
            Final content length: {finalPromptContent.length} chars
          </div>
        )}
      </div>
    </BaseDialog>
  );
};