import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { getMessage } from '@/core/utils/i18n';
import { CompactMetadataSection } from '../editors/AdvancedEditor/CompactMetadataSection';
import { PlaceholderPanel } from '../editors/BasicEditor/PlaceholderPanel';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useBlockManager } from '@/hooks/prompts/editors/useBlockManager';
import { PromptMetadata } from '@/types/prompts/metadata';
import { TemplateEditorProvider } from './TemplateEditorContext';
import { convertMetadataToVirtualBlocks, extractPlaceholdersFromBlocks } from '@/utils/templates/enhancedPreviewUtils';
import { buildPromptPart } from '@/utils/prompts/blockUtils';
import { updateSingleMetadata, updateMetadataItem } from '@/utils/prompts/metadataUtils';
import { generateUnifiedPreviewHtml } from '@/utils/templates/placeholderHelpers';
import { EnhancedEditablePreview } from '@/components/prompts/EnhancedEditablePreview';
import { useThemeDetector } from '@/hooks/useThemeDetector';

interface TemplateEditorDialogProps {
  // State from base hook
  isOpen: boolean;
  error: string | null;
  metadata: PromptMetadata;
  isProcessing: boolean;
  content: string;
  isSubmitting: boolean;
  
  // **NEW: Final content state**
  finalPromptContent?: string;
  hasUnsavedFinalChanges?: boolean;
  modifiedBlocks?: Record<number, string>;
  
  // Actions from base hook
  setContent: (content: string) => void;
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
  isSubmitting,
  
  // **NEW: Final content state**
  finalPromptContent,
  hasUnsavedFinalChanges,
  modifiedBlocks,
  
  // Actions
  setContent,
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

  const isDark = useThemeDetector();

  // Placeholder management for customize mode
  interface Placeholder {
    key: string;
    value: string;
  }

  const originalContentRef = React.useRef(content);
  const originalBlockCacheRef = React.useRef(blockContentCache);
  const inputRefs = React.useRef<Record<number, HTMLInputElement | null>>({});
  const activeInputIndex = React.useRef<number | null>(null);

  React.useEffect(() => {
    originalBlockCacheRef.current = blockContentCache;
  }, [blockContentCache]);

  React.useEffect(() => {
    if (isOpen && mode === 'customize') {
      originalContentRef.current = content;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  const getPlaceholderKeys = React.useCallback((): string[] => {
    const base = mode === 'customize' ? originalContentRef.current : content;
    const fromContent = (base.match(/\[([^\]]+)\]/g) || []).map(m => m.slice(1, -1));

    const virtual = convertMetadataToVirtualBlocks(metadata, blockContentCache);
    const fromBlocks = extractPlaceholdersFromBlocks(virtual).map(p => p.key);

    const keys = new Set<string>();
    fromContent.forEach(k => keys.add(k));
    fromBlocks.forEach(k => keys.add(k));

    return Array.from(keys);
  }, [metadata, blockContentCache, mode, content]);

  const [placeholders, setPlaceholders] = React.useState<Placeholder[]>(() => {
    if (mode === 'customize') {
      return getPlaceholderKeys().map(key => ({ key, value: '' }));
    }
    return [];
  });

  React.useEffect(() => {
    if (mode === 'customize') {
      const keys = getPlaceholderKeys();
      setPlaceholders(prev =>
        keys.map(k => {
          const existing = prev.find(p => p.key === k);
          return { key: k, value: existing?.value || '' };
        })
      );
    }
  }, [content, mode, getPlaceholderKeys]);

  const computeContent = React.useCallback((list: Placeholder[]) => {
    let result = originalContentRef.current;
    const updatedCache: Record<number, string> = { ...originalBlockCacheRef.current };

    list.forEach(({ key, value }) => {
      if (!value.trim()) return;
      const regex = new RegExp(`\\[${key.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\]`, 'g');
      result = result.replace(regex, value);

      Object.keys(updatedCache).forEach(id => {
        updatedCache[parseInt(id, 10)] = updatedCache[parseInt(id, 10)].replace(regex, value);
      });
    });

    return { content: result, cache: updatedCache };
  }, []);

  const computed = React.useMemo(() => computeContent(placeholders), [computeContent, placeholders]);
  const previewContent = computed.content;
  const previewCache = computed.cache;

  React.useEffect(() => {
    if (mode === 'customize') {
      setContent(previewContent);
    }
  }, [previewContent, setContent, mode]);

  React.useEffect(() => {
    if (mode === 'customize') {
      const map: Record<string, string> = {};
      placeholders.forEach(p => {
        if (p.value.trim()) map[p.key] = p.value;
      });
      document.dispatchEvent(new CustomEvent('jaydai:placeholder-values', { detail: map }));
    }
  }, [placeholders, mode]);

  const updatePlaceholder = React.useCallback((index: number, value: string) => {
    setPlaceholders(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  }, []);

  const resetPlaceholders = React.useCallback(() => {
    setPlaceholders(prev => prev.map(p => ({ ...p, value: '' })));
    setContent(originalContentRef.current);
  }, [setContent]);

  const combinedBlockCache = React.useMemo(
    () => ({
      ...(mode === 'customize' ? previewCache : blockContentCache),
      ...(modifiedBlocks || {})
    }),
    [blockContentCache, previewCache, modifiedBlocks, mode]
  );

  const virtualBlocks = React.useMemo(
    () => convertMetadataToVirtualBlocks(metadata, combinedBlockCache),
    [metadata, combinedBlockCache]
  );

  const computeInitial = React.useCallback(() => {
    const ranges: Record<string, { start: number; end: number }> = {};
    const parts: string[] = [];
    let index = 0;

    virtualBlocks.forEach(v => {
      const text = buildPromptPart(
        v.type,
        combinedBlockCache[v.originalBlockId || 0] || v.content
      );
      ranges[v.id] = { start: index, end: index + text.length };
      parts.push(text);
      index += text.length + 2; // account for \n\n when joining
    });

    const baseContent = mode === 'customize' ? previewContent : content;
    if (baseContent.trim()) {
      ranges['__outro__'] = { start: index, end: index + baseContent.trim().length };
      parts.push(baseContent.trim());
    }

    return { text: parts.join('\n\n'), ranges };
  }, [virtualBlocks, combinedBlockCache, previewContent, content, mode]);

  const [blockRanges, setBlockRanges] = React.useState<Record<string, { start: number; end: number }>>({});

  const initialFinal = React.useMemo(() => {
    const { text, ranges } = computeInitial();
    setBlockRanges(ranges);
    return text;
  }, [computeInitial]);

  const [localFinal, setLocalFinal] = React.useState(initialFinal);

  React.useEffect(() => {
    if (isOpen) {
      const { text, ranges } = computeInitial();
      setBlockRanges(ranges);
      setLocalFinal(finalPromptContent || text);
    }
  }, [isOpen, finalPromptContent, computeInitial]);

  const finalHtml = React.useMemo(
    () => generateUnifiedPreviewHtml(localFinal, isDark),
    [localFinal, isDark]
  );

  const handleFinalChange = React.useCallback(
    (text: string) => {
      setLocalFinal(text);
      setFinalPromptContent && setFinalPromptContent(text);

      const segments = text.split(/\n{2,}/);
      const newRanges: Record<string, { start: number; end: number }> = {};
      let idxPos = 0;
      virtualBlocks.forEach((block, idx) => {
        let seg = segments[idx] ?? '';
        newRanges[block.id] = { start: idxPos, end: idxPos + seg.length };
        idxPos += seg.length + 2;
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
        }
      });

      setBlockRanges(newRanges);

      const additional: Record<string, string> = {};
      if (virtualBlocks.length === 0) {
        if (text.trim()) additional.intro = text.trim();
      } else {
        const first = virtualBlocks[0];
        const intro = text.slice(0, newRanges[first.id].start).trim();
        if (intro) additional.intro = intro;
        for (let i = 0; i < virtualBlocks.length; i++) {
          const block = virtualBlocks[i];
          const end = newRanges[block.id].end;
          const nextStart =
            i < virtualBlocks.length - 1
              ? newRanges[virtualBlocks[i + 1].id].start
              : text.length;
          const after = text.slice(end, nextStart).trim();
          if (after) {
            const key = block.metadataType || block.type;
            additional[key] = after;
          }
        }
      }

      if (Object.keys(additional).length > 0) {
        setMetadata(prev => ({ ...prev, additional_text: additional }));
      }
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
        <div className="jd-flex jd-flex-col jd-min-h-0 jd-overflow-hidden">
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
              <div className="jd-flex jd-flex-col jd-flex-1 jd-min-h-0 jd-overflow-hidden">
                {/* Compact Metadata Section */}
                <div className="jd-flex-shrink-0 jd-mb-6">
                  <CompactMetadataSection
                    availableMetadataBlocks={availableMetadataBlocks}
                  />
                </div>

                {/* Preview / Placeholder row */}
                <div className="jd-flex-1 jd-min-h-0 jd-mt-4 jd-overflow-hidden">
                  {mode === 'customize' ? (
                    <ResizablePanelGroup direction="horizontal" className="jd-h-full jd-w-full">
                      <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                        <PlaceholderPanel
                          placeholders={placeholders}
                          inputRefs={inputRefs}
                          activeInputIndex={activeInputIndex}
                          onUpdatePlaceholder={updatePlaceholder}
                          onResetPlaceholders={resetPlaceholders}
                        />
                      </ResizablePanel>

                      <ResizableHandle withHandle />

                      <ResizablePanel defaultSize={70} minSize={40}>
                        <EnhancedEditablePreview
                          blockContentCache={combinedBlockCache}
                          isDarkMode={isDark}
                          finalPromptContent={localFinal}
                          onFinalContentChange={handleFinalChange}
                          editable
                          className="jd-h-full"
                        />
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  ) : (
                    <EnhancedEditablePreview
                      blockContentCache={combinedBlockCache}
                      isDarkMode={isDark}
                      finalPromptContent={localFinal}
                      onFinalContentChange={handleFinalChange}
                      editable
                      className="jd-h-full"
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </TemplateEditorProvider>
    </BaseDialog>
  );
};