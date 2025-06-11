// src/components/dialogs/prompts/TemplateEditorDialog/index.tsx - Updated
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { getMessage } from '@/core/utils/i18n';
import { BasicEditor, AdvancedEditor } from '../editors';
import { useBlockManager } from '@/hooks/prompts/editors/useBlockManager';
import { 
  PromptMetadata, 
  MetadataType, 
  SingleMetadataType, 
  MultipleMetadataType, 
  MetadataItem 
} from '@/types/prompts/metadata';

interface TemplateEditorDialogProps {
  // State from base hook
  isOpen: boolean;
  error: string | null;
  metadata: PromptMetadata;
  isProcessing: boolean;
  content: string;
  activeTab: 'basic' | 'advanced';
  isSubmitting: boolean;
  
  // Actions from base hook
  setContent: (content: string) => void;
  setActiveTab: (tab: 'basic' | 'advanced') => void;
  handleComplete: () => Promise<void>;
  handleClose: () => void;
  
  // Metadata setter for child components
  setMetadata: (updater: (metadata: PromptMetadata) => PromptMetadata) => void;
  
  // UI state from base hook
  expandedMetadata: MetadataType | null;
  setExpandedMetadata: (type: MetadataType | null) => void;
  activeSecondaryMetadata: Set<MetadataType>;
  metadataCollapsed: boolean;
  setMetadataCollapsed: (collapsed: boolean) => void;
  secondaryMetadataCollapsed: boolean;
  setSecondaryMetadataCollapsed: (collapsed: boolean) => void;
  customValues: Record<string, string>;
  
  // Dialog config
  dialogTitle: string;
  dialogDescription: string;
  mode: 'create' | 'customize' | 'edit';
  infoForm?: React.ReactNode;
}

export const TemplateEditorDialog: React.FC<TemplateEditorDialogProps> = ({
  // State
  isOpen,
  error,
  metadata,
  isProcessing,
  content,
  activeTab,
  isSubmitting,
  
  // Actions
  setContent,
  setActiveTab,
  handleComplete,
  handleClose,

  // Metadata
  setMetadata,
  
  // UI state
  expandedMetadata,
  setExpandedMetadata,
  activeSecondaryMetadata,
  metadataCollapsed,
  setMetadataCollapsed,
  secondaryMetadataCollapsed,
  setSecondaryMetadataCollapsed,
  customValues,
  
  // Config
  dialogTitle,
  dialogDescription,
  mode,
  infoForm
}) => {
  const {
    isLoading: blocksLoading,
    availableMetadataBlocks,
    availableBlocksByType,
    blockContentCache,
    buildFinalPromptContent,
    addNewBlock
  } = useBlockManager();

  // Build final content for preview
  const finalPromptContent = React.useMemo(() => {
    if (blocksLoading) return '';
    return buildFinalPromptContent(metadata, content);
  }, [metadata, content, buildFinalPromptContent, blocksLoading]);


  // Create metadata UI state object for AdvancedEditor
  const metadataUIState = React.useMemo(() => ({
    expandedMetadata,
    setExpandedMetadata,
    activeSecondaryMetadata,
    metadataCollapsed,
    setMetadataCollapsed,
    secondaryMetadataCollapsed,
    setSecondaryMetadataCollapsed,
    customValues
  }), [
    expandedMetadata,
    setExpandedMetadata,
    activeSecondaryMetadata,
    metadataCollapsed,
    setMetadataCollapsed,
    secondaryMetadataCollapsed,
    setSecondaryMetadataCollapsed,
    customValues
  ]);

  if (!isOpen) return null;

  if (error && !isProcessing) {
    return (
      <BaseDialog
        open={isOpen}
        onOpenChange={(open: boolean) => {
          if (!open) handleClose();
        }}
        title={dialogTitle}
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
      title={dialogTitle}
      description={dialogDescription}
      className="jd-max-w-6xl jd-h-[100vh]"
    >
      {infoForm}
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
                onContentChange={setContent}
                mode={mode as any}
                isProcessing={false}
                metadata={metadata}
                finalPromptContent={finalPromptContent}
              />
            </TabsContent>

            <TabsContent value="advanced" className="jd-flex-1 jd-overflow-y-auto">
              <AdvancedEditor
                content={content}
                onContentChange={setContent}
                isProcessing={false}
                resolvedMetadata={metadata}
                setMetadata={setMetadata}
                metadataUIState={metadataUIState}
                availableMetadataBlocks={availableMetadataBlocks}
                availableBlocksByType={availableBlocksByType}
                blockContentCache={blockContentCache}
                onBlockSaved={addNewBlock}
                finalPromptContent={finalPromptContent}
              />
            </TabsContent>
          </Tabs>
        )}
        
        <div className="jd-flex jd-justify-end jd-gap-2 jd-pt-4 jd-border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {getMessage('cancel', undefined, 'Cancel')}
          </Button>
          <Button onClick={handleComplete} disabled={isLoading || isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="jd-animate-spin jd-h-4 jd-w-4 jd-border-2 jd-border-current jd-border-t-transparent jd-rounded-full jd-mr-2"></div>
                {getMessage('saving', undefined, 'Saving...')}
              </>
            ) : (
              mode === 'create' ? getMessage('createTemplate', undefined, 'Create Template') :  getMessage('saveTemplate', undefined, 'Save Template')
            )}
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="jd-text-xs jd-text-gray-500 jd-mt-2">
            Final content length: {finalPromptContent.length} chars
          </div>
        )}
      </div>
    </BaseDialog>
  );
};