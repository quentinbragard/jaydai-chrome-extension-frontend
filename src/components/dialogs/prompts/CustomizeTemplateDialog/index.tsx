// src/components/dialogs/templates/CustomizeTemplateDialog.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { getMessage } from '@/core/utils/i18n';
import { BasicEditor, AdvancedEditor } from '../editors';
import { useCustomizeTemplateDialog } from '@/hooks/dialogs/useCustomizeTemplateDialog';

/**
 * Dialog for editing template content using blocks with Basic/Advanced modes
 */
export const CustomizeTemplateDialog: React.FC = () => {
  const {
    isOpen,
    error,
    metadata,
    isProcessing,
    activeTab,
    setActiveTab,
    content,
    setContent,
    handleUpdateMetadata,
    handleComplete,
    handleClose,
    finalPromptContent
  } = useCustomizeTemplateDialog();

  if (!isOpen) return null;

  if (error && !isProcessing) {
    return (
      <BaseDialog
        open={isOpen}
        onOpenChange={(open: boolean) => {
          if (!open) handleClose();
        }}
        title={getMessage('CustomizeTemplateDialog', undefined, 'Prompt Block Editor')}
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

  const basicProps = {
    content,
    metadata,
    onContentChange: setContent,
    onUpdateMetadata: handleUpdateMetadata,
    isProcessing
  };

  const advancedProps = {
    content,
    metadata,
    onContentChange: setContent,
    onUpdateMetadata: handleUpdateMetadata,
    isProcessing
  };

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) handleClose();
      }}
      title={getMessage('CustomizeTemplateDialog', undefined, 'Prompt Block Editor')}
      description={getMessage('CustomizeTemplateDialogDescription', undefined, 'Build your prompt using blocks')}
      className="jd-max-w-6xl jd-h-[100vh]"
    >
      <div className="jd-flex jd-flex-col jd-h-full jd-gap-4">
        {error && (
          <Alert variant="destructive" className="jd-mb-2">
            <AlertTriangle className="jd-h-4 jd-w-4 jd-mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isProcessing ? (
          <div className="jd-flex jd-items-center jd-justify-center jd-h-64">
            <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full"></div>
            <span className="jd-ml-3 jd-text-gray-600">{getMessage('loadingTemplate')}</span>
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
              <BasicEditor {...basicProps} mode="customize" />
            </TabsContent>

            <TabsContent value="advanced" className="jd-flex-1 jd-overflow-y-auto">
              <AdvancedEditor {...advancedProps} />
            </TabsContent>
          </Tabs>
        )}

        <div className="jd-flex jd-justify-end jd-gap-2 jd-pt-4 jd-border-t">
          <Button variant="outline" onClick={handleClose}>
            {getMessage('cancel', undefined, 'Cancel')}
          </Button>
          <Button onClick={() => handleComplete(finalPromptContent)} disabled={isProcessing}>
            {getMessage('useTemplate', undefined, 'Use Template')}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
};
