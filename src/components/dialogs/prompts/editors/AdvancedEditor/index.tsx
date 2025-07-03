// src/components/dialogs/prompts/editors/AdvancedEditor/index.tsx - Fixed Version
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { MetadataSection } from './MetadataSection';
import { useTemplateEditor } from '../../TemplateEditorDialog/TemplateEditorContext';
import TemplatePreview from '@/components/prompts/TemplatePreview';
import { getMessage } from '@/core/utils/i18n';
import {
  convertMetadataToVirtualBlocks,
  extractPlaceholdersFromBlocks
} from '@/utils/templates/enhancedPreviewUtils';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { PlaceholderPanel } from '../BasicEditor/PlaceholderPanel';

interface AdvancedEditorProps {
  mode?: 'create' | 'customize';
  isProcessing?: boolean;
}

interface Placeholder {
  key: string;
  value: string;
}

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  mode = 'customize',
  isProcessing = false
}) => {
  const {
    metadata,
    content,
    setContent,
    availableMetadataBlocks,
    blockContentCache
  } = useTemplateEditor();

  const isDarkMode = useThemeDetector();

  // ----- Placeholder logic (only used in customize mode) -----
  const originalContentRef = useRef(content);
  const originalBlockCacheRef = useRef(blockContentCache);

  useEffect(() => {
    originalBlockCacheRef.current = blockContentCache;
  }, [blockContentCache]);

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

  const [placeholders, setPlaceholders] = useState<Placeholder[]>(() => {
    if (mode === 'customize') {
      const keys = getPlaceholderKeys();
      return keys.map(key => ({ key, value: '' }));
    }
    return [];
  });

  useEffect(() => {
    if (mode === 'customize') {
      const keys = getPlaceholderKeys();
      setPlaceholders(prev =>
        keys.map(k => {
          const existing = prev.find(p => p.key === k);
          return { key: k, value: existing?.value || '' };
        })
      );
    }
  }, [getPlaceholderKeys, mode]);

  const computeContent = useCallback(
    (list: Placeholder[]) => {
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
    },
    []
  );

  const computed = React.useMemo(() => computeContent(placeholders), [computeContent, placeholders]);
  const previewContent = computed.content;
  const previewCache = computed.cache;

  useEffect(() => {
    if (mode === 'customize') {
      // keep content synced so dialog completion uses replaced version
      setContent(previewContent);
    }
  }, [previewContent, mode, setContent]);

  const updatePlaceholder = useCallback((index: number, value: string) => {
    setPlaceholders(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  }, []);

  const resetPlaceholders = useCallback(() => {
    setPlaceholders(prev => prev.map(p => ({ ...p, value: '' })));
  }, []);

  if (isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full" />
        <span className="jd-ml-3 jd-text-gray-600">Loading template...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'jd-h-full jd-flex jd-flex-col jd-relative jd-overflow-hidden',
        isDarkMode
          ? 'jd-bg-gradient-to-br jd-from-gray-900 jd-via-gray-800 jd-to-gray-900'
          : 'jd-bg-gradient-to-br jd-from-slate-50 jd-via-white jd-to-slate-100'
      )}
    >
      {/* Main content area - scrollable */}
      <div className="jd-relative jd-z-10 jd-flex-1 jd-flex jd-flex-col jd-min-h-0 jd-overflow-y-auto jd-p-6">
        
        {/* 1. PRIMARY METADATA SECTION */}
        <div className="jd-flex-shrink-0 jd-mb-6">
          <MetadataSection
            availableMetadataBlocks={availableMetadataBlocks}
            showPrimary={true}
            showSecondary={false}
          />
        </div>

        {/* 2. PREVIEW SECTION - Read Only or with placeholders */}
        <div className="jd-flex-shrink-0 jd-mb-6">
          <div className="jd-space-y-3">
            <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
              <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-blue-500 jd-to-purple-600 jd-rounded-full"></span>
              {getMessage('completePreview', undefined, 'Complete Preview')}
            </h3>

            {mode === 'customize' ? (
              <ResizablePanelGroup direction="horizontal" className="jd-h-[400px] jd-w-full">
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                  <PlaceholderPanel
                    placeholders={placeholders}
                    onUpdatePlaceholder={updatePlaceholder}
                    onResetPlaceholders={resetPlaceholders}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={70} minSize={40}>
                  <div className="jd-h-full jd-border jd-rounded-md jd-p-1 jd-bg-gradient-to-r jd-from-blue-500/10 jd-to-purple-500/10 jd-border-blue-200 jd-dark:jd-border-blue-700 jd-flex jd-flex-col jd-min-h-0 jd-overflow-hidden">
                    <div className="jd-max-h-full jd-overflow-y-auto jd-flex-1 jd-min-h-0">
                      <TemplatePreview
                        metadata={metadata}
                        content={previewContent}
                        blockContentCache={previewCache}
                        isDarkMode={isDarkMode}
                        className="jd-min-h-0"
                      />
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="jd-border jd-rounded-lg jd-p-1 jd-bg-gradient-to-r jd-from-blue-500/10 jd-to-purple-500/10 jd-border-blue-200 jd-dark:jd-border-blue-700">
                <div className="jd-max-h-[400px] jd-overflow-y-auto">
                  <TemplatePreview
                    metadata={metadata}
                    content={content}
                    blockContentCache={blockContentCache}
                    isDarkMode={isDarkMode}
                    className="jd-min-h-0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. SECONDARY METADATA SECTION */}
        <div className="jd-flex-shrink-0">
          <MetadataSection
            availableMetadataBlocks={availableMetadataBlocks}
            showPrimary={false}
            showSecondary={true}
          />
        </div>
      </div>
    </div>
  );
};