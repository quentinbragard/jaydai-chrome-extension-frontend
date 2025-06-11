import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { getMessage } from '@/core/utils/i18n';
import { BasicEditor, AdvancedEditor } from '../editors';
import { TemplateMetadataProvider } from '@/hooks/prompts/useTemplateMetadata';
import { useBlockManager } from '@/hooks/prompts/editors/useBlockManager';
import { PromptMetadata, DEFAULT_METADATA } from '@/types/prompts/metadata';

interface TemplateEditorDialogProps {
  isOpen: boolean;
  error: string | null;
  rawMetadata: PromptMetadata;
  isProcessing: boolean;
  content: string;
  setContent: (content: string) => void;
  onUpdateMetadata: (item: TemplateMetadataItem, mode: 'add' | 'remove') => void;
  onComplete: (finalContent: string) => void;
  onClose: () => void;
  dialogTitle: string;
  dialogDescription: string;
  mode: 'create' | 'customize' | 'edit';
  infoForm?: React.ReactNode;
}

export const TemplateEditorDialog: React.FC<TemplateEditorDialogProps> = ({
  isOpen,
  error,
  rawMetadata,
  isProcessing,
  content,
  setContent,
  onUpdateMetadata,
  onComplete,
  onClose,
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
    resolveMetadataToContent,
    buildFinalPromptContent
  } = useBlockManager();

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  const resolvedMetadata = useMemo(() => {
    if (!rawMetadata || blocksLoading) return DEFAULT_METADATA;
    return resolveMetadataToContent(rawMetadata);
  }, [rawMetadata, resolveMetadataToContent, blocksLoading]);

  const finalPromptContent = useMemo(() => {
    if (blocksLoading) return '';
    return buildFinalPromptContent(rawMetadata || DEFAULT_METADATA, content);
  }, [rawMetadata, content, buildFinalPromptContent, blocksLoading]);

  const handleCompleteWithResolvedContent = () => {
    onComplete(finalPromptContent);
  };

  if (!isOpen) return null;

  if (error && !isProcessing) {
    return (
      <BaseDialog
        open={isOpen}
        onOpenChange={(open: boolean) => {
          if (!open) onClose();
        }}
        title={dialogTitle}
        className="jd-max-w-4xl jd-h-[80vh]"
      >
        <div className="jd-flex jd-flex-col jd-items-center jd-justify-center jd-h-64">
          <Alert variant="destructive" className="jd-mb-4 jd-max-w-md">
            <AlertTriangle className="jd-h-4 jd-w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={onClose} variant="outline">
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
        if (!open) onClose();
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
          <TemplateMetadataProvider
            initialMetadata={resolvedMetadata}
            onMetadataChange={onUpdateMetadata}
          >
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
                mode={mode}
                isProcessing={false}
                finalPromptContent={finalPromptContent}
              />
            </TabsContent>

            <TabsContent value="advanced" className="jd-flex-1 jd-overflow-y-auto">
              <AdvancedEditor
                content={content}
                onContentChange={setContent}
                isProcessing={false}
                availableMetadataBlocks={availableMetadataBlocks}
                availableBlocksByType={availableBlocksByType}
                blockContentCache={blockContentCache}
                resolvedMetadata={resolvedMetadata}
                finalPromptContent={finalPromptContent}
              />
            </TabsContent>
          </Tabs>
          </TemplateMetadataProvider>
        )}
        <div className="jd-flex jd-justify-end jd-gap-2 jd-pt-4 jd-border-t">
          <Button variant="outline" onClick={onClose}>
            {getMessage('cancel', undefined, 'Cancel')}
          </Button>
          <Button onClick={handleCompleteWithResolvedContent} disabled={isLoading}>
            {mode === 'create' ? getMessage('createTemplate', undefined, 'Create Template') :  getMessage('saveTemplate', undefined, 'Save Template')}
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
