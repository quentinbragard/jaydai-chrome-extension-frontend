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
import { convertMetadataToVirtualBlocks } from '@/utils/templates/enhancedPreviewUtils';
import { buildPromptPart } from '@/utils/prompts/blockUtils';
import { updateSingleMetadata, updateMetadataItem } from '@/utils/prompts/metadataUtils';
import { generateUnifiedPreviewHtml } from '@/utils/templates/placeholderHelpers';
import { EnhancedEditablePreview } from '@/components/prompts/EnhancedEditablePreview';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { trackEvent, EVENTS } from '@/utils/amplitude';

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
  initialMetadata: PromptMetadata;
  resetMetadata: () => void;
  
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
  header?: React.ReactNode;
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
  initialMetadata,
  resetMetadata,
  
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
  header,
  infoForm
}) => {
  const {
    isLoading: blocksLoading,
    availableMetadataBlocks,
    blockContentCache,
    addNewBlock
  } = useBlockManager({ metadata, content, enabled: isOpen });

  const contextValue = React.useMemo(
    () => ({
      metadata,
      setMetadata,
      initialMetadata,
      resetMetadata,
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
      initialMetadata,
      resetMetadata,
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

  const isDark = useThemeDetector();

  const combinedBlockCache = React.useMemo(
    () => ({ ...blockContentCache, ...(modifiedBlocks || {}) }),
    [blockContentCache, modifiedBlocks]
  );

  const virtualBlocks = React.useMemo(
    () => convertMetadataToVirtualBlocks(metadata, combinedBlockCache),
    [metadata, combinedBlockCache]
  );

  const initialFinal = React.useMemo(() => {
    const parts = virtualBlocks.map(v =>
      buildPromptPart(v.type, combinedBlockCache[v.originalBlockId || 0] || v.content)
    );
    if (content.trim()) parts.push(content.trim());
    return parts.join('\n\n');
  }, [virtualBlocks, combinedBlockCache, content]);

  const [localFinal, setLocalFinal] = React.useState(initialFinal);

  React.useEffect(() => {
    if (isOpen) {
      setLocalFinal(finalPromptContent || initialFinal);
    }
  }, [isOpen, finalPromptContent, initialFinal]);

  const finalHtml = React.useMemo(
    () => generateUnifiedPreviewHtml(localFinal, isDark),
    [localFinal, isDark]
  );

  const handleFinalChange = React.useCallback(
    (text: string) => {
      setLocalFinal(text);
      setFinalPromptContent && setFinalPromptContent(text);

      const segments = text.split(/\n{2,}/);
      virtualBlocks.forEach((block, idx) => {
        let seg = segments[idx] ?? '';
        const prefix = buildPromptPart(block.type, '');
        if (prefix && seg.startsWith(prefix)) seg = seg.slice(prefix.length);

        if (block.isFromMetadata) {
          if (block.metadataType) {
            if (block.itemId) {
              setMetadata(prev =>
                updateMetadataItem(prev, block.metadataType as any, block.itemId!, {
                  blockId: undefined,
                  value: seg
                })
              );
            } else {
              setMetadata(prev =>
                updateSingleMetadata(prev, block.metadataType as any, 0, seg)
              );
            }
          }
        } else if (block.originalBlockId && updateBlockContent) {
          updateBlockContent(block.originalBlockId, seg);
          trackEvent(EVENTS.BLOCK_UPDATED, {
            block_id: block.originalBlockId,
            block_type: block.type,
            source: 'TemplateEditorDialog'
          });
        }
      });
    },
    [virtualBlocks, updateBlockContent, setMetadata, setFinalPromptContent]
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
          mode === 'create' ? getMessage('createTemplate', undefined, 'Create Template') : getMessage('useTemplate', undefined, 'Use Template')
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
        header={header}
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
      header={header}
      className="jd-max-w-7xl jd-h-[98vh]"
      footer={footer}
    >
      {/* Info form - outside main content */}
      {infoForm}
      
      <TemplateEditorProvider value={contextValue}>
        {/* Main content area with proper height constraints */}
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
            <>
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
            </>
          )}
        </div>
      </TemplateEditorProvider>
    </BaseDialog>
  );
};