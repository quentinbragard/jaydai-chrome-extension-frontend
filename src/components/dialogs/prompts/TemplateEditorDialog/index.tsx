// src/components/dialogs/prompts/TemplateEditorDialog/index.tsx - Fixed Version
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { getMessage } from '@/core/utils/i18n';
import { BasicEditor, AdvancedEditor } from '../editors';
import { useBlockManager } from '@/hooks/prompts/editors/useBlockManager';
import { PromptMetadata } from '@/types/prompts/metadata';
import { TemplateEditorProvider } from './TemplateEditorContext';

interface TemplateEditorDialogProps {
  // State from base hook
  isOpen: boolean;
  error: string | null;
  metadata: PromptMetadata;
  isProcessing: boolean;
  content: string;
  activeTab: 'basic' | 'advanced';
  isSubmitting: boolean;
  
  // **NEW: Final content state**
  finalPromptContent?: string;
  hasUnsavedFinalChanges?: boolean;
  modifiedBlocks?: Record<number, string>;
  
  // Actions from base hook
  setContent: (content: string) => void;
  setActiveTab: (tab: 'basic' | 'advanced') => void;
  handleComplete: () => Promise<void>;
  handleClose: () => void;
  
  // **NEW: Final content actions**
  setFinalPromptContent?: (content: string) => void;
  applyFinalContentChanges?: () => void;
  discardFinalContentChanges?: () => void;
  updateBlockContent?: (blockId: number, content: string) => void;
  
  // Metadata setter for child components
  setMetadata: (updater: (metadata: PromptMetadata) => PromptMetadata) => void;
  
  // UI state from base hook
  expandedMetadata: Set<string>;
  toggleExpandedMetadata: (type: string) => void;
  activeSecondaryMetadata: Set<string>;
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
  
  // **NEW: Final content state**
  finalPromptContent,
  hasUnsavedFinalChanges,
  modifiedBlocks,
  
  // Actions
  setContent,
  setActiveTab,
  handleComplete,
  handleClose,
  
  // **NEW: Final content actions**
  setFinalPromptContent,
  applyFinalContentChanges,
  discardFinalContentChanges,
  updateBlockContent,
  
  setMetadata,
  
  // UI state
  expandedMetadata,
  toggleExpandedMetadata,
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
    blockContentCache,
    addNewBlock
  } = useBlockManager({ metadata, content });

  const contextValue = React.useMemo(
    () => ({
      metadata,
      setMetadata,
      expandedMetadata,
      toggleExpandedMetadata,
      activeSecondaryMetadata,
      metadataCollapsed,
      setMetadataCollapsed,
      secondaryMetadataCollapsed,
      setSecondaryMetadataCollapsed,
      customValues,
      content,
      setContent,
      blockContentCache,
      availableMetadataBlocks,
      addNewBlock
    }),
    [
      metadata,
      setMetadata,
      expandedMetadata,
      toggleExpandedMetadata,
      activeSecondaryMetadata,
      metadataCollapsed,
      setMetadataCollapsed,
      secondaryMetadataCollapsed,
      setSecondaryMetadataCollapsed,
      customValues,
      content,
      setContent,
      blockContentCache,
      availableMetadataBlocks,
      addNewBlock
    ]
  );

  // Create footer with action buttons
  const footer = (
    <div className="jd-flex jd-justify-end jd-gap-2">
      <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
        {getMessage('cancel', undefined, 'Cancel')}
      </Button>
      <Button onClick={handleComplete} disabled={isProcessing || blocksLoading || isSubmitting}>
        {isSubmitting ? (
          <>
            <div className="jd-animate-spin jd-h-4 jd-w-4 jd-border-2 jd-border-current jd-border-t-transparent jd-rounded-full jd-mr-2"></div>
            {getMessage('saving', undefined, 'Saving...')}
          </>
        ) : (
          mode === 'create' ? getMessage('createTemplate', undefined, 'Create Template') : getMessage('saveTemplate', undefined, 'Save Template')
        )}
      </Button>
    </div>
  );

  if (!isOpen) return null;

  if (error && !isProcessing) {
    return (
      <BaseDialog
        open={isOpen}
        onOpenChange={(open: boolean) => {
          if (!open) handleClose();
        }}
        title={dialogTitle}
        className="jd-max-w-4xl"
        footer={
          <Button onClick={handleClose} variant="outline">
            {getMessage('close')}
          </Button>
        }
      >
        <div className="jd-flex jd-flex-col jd-items-center jd-justify-center jd-h-64">
          <Alert variant="destructive" className="jd-mb-4 jd-max-w-md">
            <AlertTriangle className="jd-h-4 jd-w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
      className="jd-max-w-6xl jd-max-h-[90vh] jd-h-[85vh]" // Fixed height with max constraint
      footer={footer}
    >
      {/* Info form - outside main content */}
      {infoForm}
      
      <TemplateEditorProvider value={contextValue}>
        {/* Main content area with proper height constraints using only Tailwind */}
        <div className="jd-flex jd-flex-col jd-h-full jd-min-h-0 jd-overflow-hidden">
          {error && (
            <Alert variant="destructive" className="jd-mb-2 jd-flex-shrink-0">
              <AlertTriangle className="jd-h-4 jd-w-4 jd-mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="jd-flex jd-items-center jd-justify-center jd-h-64 jd-flex-shrink-0">
              <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full"></div>
              <span className="jd-ml-3 jd-text-gray-600">
                {getMessage('loadingTemplate')} {blocksLoading && '& blocks...'}
              </span>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={value => setActiveTab(value as 'basic' | 'advanced')}
              className="jd-flex jd-flex-col jd-flex-1 jd-min-h-0 jd-h-full jd-overflow-hidden"
            >
              <TabsList className="jd-grid jd-w-full jd-grid-cols-2 jd-mb-4 jd-flex-shrink-0">
                <TabsTrigger value="basic">{getMessage('basic')}</TabsTrigger>
                <TabsTrigger value="advanced">{getMessage('advanced')}</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="jd-flex-1 jd-min-h-0 jd-overflow-hidden jd-h-full data-[state=active]:flex data-[state=active]:flex-col">
                <BasicEditor mode={mode as any} isProcessing={false} />
              </TabsContent>

              <TabsContent value="advanced" className="jd-flex-1 jd-min-h-0 jd-overflow-hidden jd-h-full data-[state=active]:flex data-[state=active]:flex-col">
                <AdvancedEditor mode={mode as any} isProcessing={false} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </TemplateEditorProvider>
    </BaseDialog>
  );
};