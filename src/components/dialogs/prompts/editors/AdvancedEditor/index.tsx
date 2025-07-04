// src/components/dialogs/prompts/editors/AdvancedEditor/index.tsx - Updated Version
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { CompactMetadataSection } from './CompactMetadataSection';
import { useTemplateEditor } from '../../TemplateEditorDialog/TemplateEditorContext';
import TemplatePreview from '@/components/prompts/TemplatePreview';
import { getMessage } from '@/core/utils/i18n';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Input } from '@/components/ui/input';
import { extractPlaceholders, replacePlaceholders } from '@/utils/templates/placeholderUtils';

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

  // Placeholder management for customize mode
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [modifiedContent, setModifiedContent] = useState(content);
  const originalContentRef = useRef(content);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const activeInputIndex = useRef<number | null>(null);

  // Initialize placeholders for customize mode
  useEffect(() => {
    if (mode === 'customize') {
      const extracted = extractPlaceholders(content);
      const uniqueKeys = Array.from(new Set(extracted.map(p => p.key)));
      setPlaceholders(uniqueKeys.map(key => ({ key, value: '' })));
      originalContentRef.current = content;
    }
    setModifiedContent(content);
  }, [content, mode]);

  // Update placeholder value and content
  const updatePlaceholder = useCallback((index: number, value: string) => {
    setPlaceholders(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });

    // Update content with placeholder replacements
    const placeholderMap = placeholders.reduce((acc, p, i) => {
      acc[p.key] = i === index ? value : p.value;
      return acc;
    }, {} as Record<string, string>);
    
    const newContent = replacePlaceholders(originalContentRef.current, placeholderMap);
    setModifiedContent(newContent);
    setContent(newContent);
  }, [placeholders, setContent]);

  // Reset placeholders
  const resetPlaceholders = useCallback(() => {
    setPlaceholders(prev => prev.map(p => ({ ...p, value: '' })));
    setModifiedContent(originalContentRef.current);
    setContent(originalContentRef.current);
  }, [setContent]);

  if (isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full" />
        <span className="jd-ml-3 jd-text-gray-600">Loading template...</span>
      </div>
    );
  }

  // For customize mode with placeholder panel
  if (mode === 'customize') {
    return (
      <div className="jd-h-full jd-flex jd-flex-1 jd-min-h-0 jd-overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="jd-h-full jd-w-full">
          {/* Placeholder Panel */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <PlaceholderPanel
              placeholders={placeholders}
              onUpdatePlaceholder={updatePlaceholder}
              onResetPlaceholders={resetPlaceholders}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Metadata and Preview Panel */}
          <ResizablePanel defaultSize={75} minSize={50}>
            <div className={cn(
              'jd-h-full jd-flex jd-flex-col jd-relative jd-overflow-hidden jd-p-4',
              isDarkMode
                ? 'jd-bg-gradient-to-br jd-from-gray-900 jd-via-gray-800 jd-to-gray-900'
                : 'jd-bg-gradient-to-br jd-from-slate-50 jd-via-white jd-to-slate-100'
            )}>
              
              {/* Compact Metadata Section */}
              <div className="jd-flex-shrink-0 jd-mb-4">
                <CompactMetadataSection
                  availableMetadataBlocks={availableMetadataBlocks}
                />
              </div>

              {/* Preview Section */}
              <div className="jd-flex-1 jd-min-h-0">
                <div className="jd-space-y-3 jd-h-full jd-flex jd-flex-col">
                  <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2 jd-flex-shrink-0">
                    <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-blue-500 jd-to-purple-600 jd-rounded-full"></span>
                    {getMessage('completePreview', undefined, 'Complete Preview')}
                  </h3>
                  
                  <div className="jd-border jd-rounded-lg jd-p-1 jd-bg-gradient-to-r jd-from-blue-500/10 jd-to-purple-500/10 jd-border-blue-200 jd-dark:jd-border-blue-700 jd-flex-1 jd-min-h-0">
                    <TemplatePreview
                      metadata={metadata}
                      content={modifiedContent}
                      blockContentCache={blockContentCache}
                      isDarkMode={isDarkMode}
                      className="jd-h-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  // For create mode (no placeholder panel)
  return (
    <div className={cn(
      'jd-h-full jd-flex jd-flex-col jd-relative jd-overflow-hidden jd-p-6',
      isDarkMode
        ? 'jd-bg-gradient-to-br jd-from-gray-900 jd-via-gray-800 jd-to-gray-900'
        : 'jd-bg-gradient-to-br jd-from-slate-50 jd-via-white jd-to-slate-100'
    )}>
      
      {/* Compact Metadata Section */}
      <div className="jd-flex-shrink-0 jd-mb-6">
        <CompactMetadataSection
          availableMetadataBlocks={availableMetadataBlocks}
        />
      </div>

      {/* Preview Section */}
      <div className="jd-flex-1 jd-min-h-0">
        <div className="jd-space-y-3 jd-h-full jd-flex jd-flex-col">
          <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2 jd-flex-shrink-0">
            <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-blue-500 jd-to-purple-600 jd-rounded-full"></span>
            {getMessage('completePreview', undefined, 'Complete Preview')}
          </h3>
          
          <div className="jd-border jd-rounded-lg jd-p-1 jd-bg-gradient-to-r jd-from-blue-500/10 jd-to-purple-500/10 jd-border-blue-200 jd-dark:jd-border-blue-700 jd-flex-1 jd-min-h-0">
            <TemplatePreview
              metadata={metadata}
              content={content}
              blockContentCache={blockContentCache}
              isDarkMode={isDarkMode}
              className="jd-h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder Panel Component
const PlaceholderPanel: React.FC<{
  placeholders: Placeholder[];
  onUpdatePlaceholder: (index: number, value: string) => void;
  onResetPlaceholders: () => void;
}> = ({ placeholders, onUpdatePlaceholder, onResetPlaceholders }) => {
  const filledCount = placeholders.filter(p => p.value.trim()).length;
  const totalCount = placeholders.length;

  return (
    <div className="jd-h-full jd-flex jd-flex-col jd-min-h-0 jd-overflow-hidden jd-p-4">
      {/* Header */}
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
          <button
            onClick={onResetPlaceholders}
            className="jd-text-xs jd-text-muted-foreground hover:jd-text-foreground jd-underline"
            title={getMessage('resetAllPlaceholders', undefined, 'Reset all placeholders')}
          >
            {getMessage('reset', undefined, 'Reset')}
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="jd-flex-1 jd-min-h-0 jd-overflow-y-auto jd-pr-2">
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