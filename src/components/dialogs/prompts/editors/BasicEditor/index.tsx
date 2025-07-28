// src/components/dialogs/prompts/editors/BasicEditor/index.tsx - Fixed Version
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/core/utils/classNames';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { useTemplateEditor } from '../../TemplateEditorDialog/TemplateEditorContext';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import TemplatePreview from '@/components/prompts/TemplatePreview';
import { getMessage } from '@/core/utils/i18n';
import {
  convertMetadataToVirtualBlocks,
  extractPlaceholdersFromBlocks
} from '@/utils/templates/enhancedPreviewUtils';
import { replacePlaceholders } from '@/utils/templates/placeholderHelpers';
import { countMetadataItems } from '@/utils/prompts/metadataUtils';
import { trackEvent, EVENTS } from '@/utils/analytics';

interface Placeholder {
  key: string; // without brackets
  value: string;
}

interface BasicEditorProps {
  mode?: 'create' | 'customize' | 'edit';
  isProcessing?: boolean;
}

/**
 * Fixed Basic editor with proper height constraints and scrolling
 */
export const BasicEditor: React.FC<BasicEditorProps> = ({
  mode = 'customize',
  isProcessing = false
}) => {
  const {
    metadata,
    content,
    setContent,
    blockContentCache
  } = useTemplateEditor();

  const isDark = useThemeDetector();
  const [showPreview, setShowPreview] = useState(mode === 'customize');
  const [previewHiddenManually, setPreviewHiddenManually] = useState(false);

  // Keep a reference to the original content so placeholder replacements do not
  // accumulate when editing values in the placeholder panel
  const originalContentRef = useRef(content);
  const originalBlockCacheRef = useRef(blockContentCache);

  // Map placeholder -> block IDs for replacements
  useEffect(() => {
    originalBlockCacheRef.current = blockContentCache;
  }, [blockContentCache]);

  // Keep the original content reference stable in customize mode so
  // placeholder keys remain available after replacement.
  useEffect(() => {
    if (mode !== 'customize') {
      originalContentRef.current = content;
    }
  }, [content, mode]);
  
  // Utility to gather placeholder keys from content and metadata blocks
  const getPlaceholderKeys = useCallback((): string[] => {
    const base = mode === 'customize' ? originalContentRef.current : content;
    const fromContent = (base.match(/\[([^\]]+)\]/g) || []).map(m => m.slice(1, -1));

    const virtualBlocks = convertMetadataToVirtualBlocks(metadata, blockContentCache);
    const fromBlocks = extractPlaceholdersFromBlocks(virtualBlocks);

    const keys = new Set<string>();
    fromContent.forEach(key => keys.add(key));
    fromBlocks.forEach(({ key }) => keys.add(key));

    return Array.from(keys);
  }, [metadata, blockContentCache, mode, content]);

  // Simple placeholder extraction and management
  const [placeholders, setPlaceholders] = useState<Placeholder[]>(() => {
    if (mode === 'customize') {
      const keys = getPlaceholderKeys();
      return keys.map(key => ({ key, value: '' }));
    }
    return [];
  });

  // Update placeholders when relevant data changes (for customize mode)
  React.useEffect(() => {
    if (mode === 'customize') {
      const keys = getPlaceholderKeys();
      setPlaceholders(prev =>
        keys.map(key => {
          const existing = prev.find(p => p.key === key);
          return { key, value: existing?.value || '' };
        })
      );
    }
  }, [getPlaceholderKeys, mode]);

  // Broadcast placeholder values for other hooks
  useEffect(() => {
    if (mode === 'customize') {
      const map: Record<string, string> = {};
      placeholders.forEach(p => {
        if (p.value.trim()) map[p.key] = p.value;
      });
      document.dispatchEvent(
        new CustomEvent('jaydai:placeholder-values', { detail: map })
      );
    }
  }, [placeholders, mode]);

  // Build content with placeholders replaced based on the original content
  const computeContent = useCallback(
    (list: Placeholder[]) => {
      let result = originalContentRef.current;
      const updatedCache: Record<number, string> = { ...originalBlockCacheRef.current };

      // Build a map of placeholder -> value for easy replacement
      const map: Record<string, string> = {};
      list.forEach(({ key, value }) => {
        if (value.trim()) {
          map[key] = value;
        }
      });

      // Use the shared helper to perform replacements with proper escaping
      result = replacePlaceholders(originalContentRef.current, map);

      Object.keys(updatedCache).forEach(id => {
        updatedCache[parseInt(id, 10)] = replacePlaceholders(updatedCache[parseInt(id, 10)], map);
      });

      return { content: result, cache: updatedCache };
    },
    []
  );

  const computed = React.useMemo(() => computeContent(placeholders), [computeContent, placeholders]);
  const previewContent = computed.content;
  const previewCache = computed.cache;

  // Sync the computed content back to the editor state so it is used when
  // the user completes the dialog
  useEffect(() => {
    if (mode === 'customize') {
      setContent(previewContent);
    }
  }, [previewContent, setContent, mode]);

  // Automatically show preview in create or edit mode when metadata is present
  useEffect(() => {
    if (
      (mode === 'create' || mode === 'edit') &&
      !showPreview &&
      !previewHiddenManually &&
      countMetadataItems(metadata) > 0
    ) {
      setShowPreview(true);
    }
  }, [metadata, mode, showPreview, previewHiddenManually]);

  const updatePlaceholder = useCallback((index: number, value: string) => {
    setPlaceholders(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  }, []);

  const resetPlaceholders = useCallback(() => {
    trackEvent(EVENTS.TEMPLATE_RESET_PLACEHOLDERS, {
      content: content,
      placeholders: placeholders
    });
    setPlaceholders(prev => prev.map(p => ({ ...p, value: '' })));
  }, []);

  const togglePreview = () => {
    trackEvent(EVENTS.TEMPLATE_TOGGLE_PREVIEW, {
      content: content,
      placeholders: placeholders
    });
    setShowPreview(prev => {
      const next = !prev;
      setPreviewHiddenManually(!next);
      return next;
    });
  };

  if (isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full" />
        <span className="jd-ml-3 jd-text-gray-600">{getMessage('loadingTemplate', undefined, 'Loading template...')}</span>
      </div>
    );
  }

  // For create or edit mode, show only the editor and allow toggling the preview
  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="jd-h-full jd-flex jd-flex-col jd-min-h-0 jd-overflow-hidden">
        {/* Header section */}
        <div className="jd-flex-shrink-0 jd-mb-4">
          <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2 jd-mb-2">
            {getMessage('editTemplateContent', undefined, 'Create Template Content')}
          </h3>
        </div>

        {/* Content editor - compact height */}
        <div className="jd-flex-shrink-0">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={getMessage('enterTemplateContent', undefined, 'Enter your template content here...')}
            className="jd-w-full !jd-min-h-[25vh] jd-resize-none jd-overflow-y-auto jd-text-sm jd-leading-relaxed"
            onKeyDown={(e) => e.stopPropagation()}
            onKeyPress={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
          />
        </div>
        
        {/* Toggle preview button - directly below textarea */}
        <div className="jd-flex-shrink-0 jd-mt-2">
          <Button
            onClick={togglePreview}
            variant="outline"
            className={cn(
              'jd-w-full jd-transition-all jd-duration-300 jd-group',
              showPreview
                ? 'jd-bg-primary jd-text-primary-foreground hover:jd-bg-primary/90'
                : 'jd-bg-background hover:jd-bg-muted'
            )}
          >
            <div className="jd-flex jd-items-center jd-gap-2">
              {showPreview ? (
                <>
                  <EyeOff className="jd-h-4 jd-w-4 jd-transition-transform group-hover:jd-scale-110" />
                  <span>{getMessage('hidePreview', undefined, 'Hide Preview')}</span>
                  <ChevronUp className="jd-h-4 jd-w-4 jd-transition-transform group-hover:jd-rotate-180" />
                </>
              ) : (
                <>
                  <Eye className="jd-h-4 jd-w-4 jd-transition-transform group-hover:jd-scale-110" />
                  <span>{getMessage('showPreview', undefined, 'Show Preview')}</span>
                  <ChevronDown className="jd-h-4 jd-w-4 jd-transition-transform group-hover:jd-rotate-180" />
                </>
              )}
            </div>
          </Button>
        </div>

        {/* Animated preview section - takes remaining space */}
        <div
          className={cn(
            'jd-transition-all jd-duration-500 jd-ease-in-out jd-overflow-hidden',
            showPreview ? 'jd-flex-1 jd-opacity-100 jd-mt-2' : 'jd-h-0 jd-opacity-0'
          )}
        >
          <div className="jd-h-full jd-rounded-lg jd-overflow-hidden">
            <TemplatePreview
              metadata={metadata}
              content={content}
              blockContentCache={blockContentCache}
              isDarkMode={isDark}
              className="jd-h-full jd-w-full"
            />
          </div>
        </div>
      </div>
    );
  }

  // For customize mode, show the interface with placeholders and preview
  return (
    <div className="jd-h-full jd-flex jd-flex-1 jd-min-h-0 jd-overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="jd-h-full jd-w-full">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <PlaceholderPanel
            placeholders={placeholders}
            onUpdatePlaceholder={updatePlaceholder}
            onResetPlaceholders={resetPlaceholders}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={70} minSize={40}>
          <div className="jd-h-full jd-rounded-md jd-p-4 jd-flex jd-flex-col jd-min-h-0 jd-overflow-hidden">
            <TemplatePreview
              metadata={metadata}
              content={previewContent}
              blockContentCache={previewCache}
              isDarkMode={isDark}
              className="jd-h-full jd-w-full"
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

// Fixed Placeholder Panel Component
const PlaceholderPanel: React.FC<{
  placeholders: Placeholder[];
  onUpdatePlaceholder: (index: number, value: string) => void;
  onResetPlaceholders: () => void;
}> = ({ placeholders, onUpdatePlaceholder, onResetPlaceholders }) => {
  const filledCount = placeholders.filter(p => p.value.trim()).length;
  const totalCount = placeholders.length;

  return (
    <div className="jd-h-full jd-flex jd-flex-col jd-min-h-0 jd-overflow-hidden jd-p-4">
      {/* Header - fixed height */}
      <div className="jd-flex jd-items-center jd-justify-between jd-mb-4 jd-flex-shrink-0">
        <h3 className="jd-text-sm jd-font-medium">
          {getMessage('replacePlaceholders', undefined, 'Replace Placeholders')}
          {totalCount > 0 && (
            <span className="jd-ml-2 jd-text-xs jd-text-muted-foreground">
              ({filledCount}/{totalCount} {getMessage('filled', undefined, 'filled')})
            </span>
          )}
        </h3>
        
        {filledCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetPlaceholders}
            className="jd-h-7 jd-px-2 jd-text-xs jd-text-muted-foreground hover:jd-text-foreground jd-flex-shrink-0"
            title={getMessage('resetAllPlaceholders', undefined, 'Reset all placeholders')}
          >
            {getMessage('reset', undefined, 'Reset')}
          </Button>
        )}
      </div>
      
      {/* Content - scrollable area */}
      <div className="jd-flex-1 jd-min-h-0 jd-overflow-y-auto jd-scrollbar-thin jd-scrollbar-thumb-gray-300 jd-scrollbar-track-gray-100 jd-dark:jd-scrollbar-thumb-gray-600 jd-dark:jd-scrollbar-track-gray-800 jd-pr-2">
        {placeholders.length > 0 ? (
          <div className="jd-space-y-4">
            {placeholders.map((placeholder, idx) => (
              <div key={placeholder.key + idx} className="jd-space-y-1 jd-flex-shrink-0">
                <label className="jd-text-sm jd-font-medium jd-flex jd-items-center">
                  <span className={`jd-px-2 jd-py-1 jd-rounded jd-transition-colors jd-text-xs jd-font-medium jd-inline-block ${
                    placeholder.value.trim()
                      ? 'jd-bg-green-100 jd-text-green-800 jd-border jd-border-green-200' 
                      : 'jd-bg-primary/10 jd-text-primary'
                  }`}>
                    {placeholder.key}
                  </span>
                </label>
                
                <Input
                  value={placeholder.value}
                  onChange={(e) => onUpdatePlaceholder(idx, e.target.value)}
                  placeholder={`${getMessage('enterValueFor', undefined, 'Enter value for')} ${placeholder.key}`}
                  className="jd-w-full jd-text-sm"
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyPress={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="jd-text-muted-foreground jd-text-center jd-py-8 jd-text-sm">
            {getMessage('noPlaceholdersFound', undefined, 'No placeholders found')}
          </div>
        )}
      </div>
    </div>
  );
};