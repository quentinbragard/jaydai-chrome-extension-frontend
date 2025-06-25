// src/components/dialogs/prompts/editors/BasicEditor/index.tsx - Simplified Version
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
import {
  convertMetadataToVirtualBlocks,
  extractPlaceholdersFromBlocks
} from '@/utils/templates/enhancedPreviewUtils';
import { replacePlaceholders } from '@/utils/templates/placeholderHelpers';

interface Placeholder {
  key: string;
  value: string;
}

interface BasicEditorProps {
  mode?: 'create' | 'customize';
  isProcessing?: boolean;
}

/**
 * Simplified Basic editor - just edits content and shows placeholders for customize mode
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
  const originalContentRef = useRef(content);

  useEffect(() => {
    if (mode === 'customize') {
      originalContentRef.current = content;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Utility to gather placeholder keys from content and metadata blocks
  const getPlaceholderKeys = useCallback((): string[] => {
    const baseContent = mode === 'customize' ? originalContentRef.current : content;
    const fromContent = baseContent.match(/\[([^\]]+)\]/g) || [];
    const virtualBlocks = convertMetadataToVirtualBlocks(metadata, blockContentCache);
    const fromBlocks = extractPlaceholdersFromBlocks(virtualBlocks).map(p => `[${p.key}]`);
    return Array.from(new Set([...fromContent, ...fromBlocks]));
  }, [content, metadata, blockContentCache, mode]);

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

  // Simple content with placeholders replaced for preview
  const previewContent = React.useMemo(() => {
    let result = content;
    placeholders.forEach(({ key, value }) => {
      if (value.trim()) {
        // Remove the brackets and replace with value
        result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
      }
    });
    return result;
  }, [content, placeholders]);

  const updatePlaceholder = useCallback(
    (index: number, value: string) => {
      setPlaceholders(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], value };
        const map = updated.reduce<Record<string, string>>((acc, p) => {
          if (p.value.trim()) acc[p.key] = p.value;
          return acc;
        }, {});
        const newContent = replacePlaceholders(originalContentRef.current, map);
        setContent(newContent);
        return updated;
      });
    },
    [setContent]
  );

  const resetPlaceholders = useCallback(() => {
    setPlaceholders(prev => prev.map(p => ({ ...p, value: '' })));
    setContent(originalContentRef.current);
  }, [setContent]);

  const togglePreview = () => setShowPreview(prev => !prev);

  if (isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full" />
        <span className="jd-ml-3 jd-text-gray-600">Loading template...</span>
      </div>
    );
  }

  // For create mode, show only the editor and allow toggling the preview
  if (mode === 'create') {
    return (
      <div className="jd-h-full jd-flex jd-flex-col jd-p-4 jd-space-y-4">
        <div className="jd-flex-shrink-0">
          <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2 jd-mb-2">
            <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-blue-500 jd-to-purple-600 jd-rounded-full"></span>
            Edit Template Content
          </h3>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your template content here..."
            className="!jd-min-h-[40vh] jd-resize-none"
            onKeyDown={(e) => e.stopPropagation()}
            onKeyPress={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
          />
        </div>
        
        {/* Toggle preview button */}
        <div className="jd-flex-shrink-0 jd-pt-4 jd-border-t">
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
                  <span>Hide Preview</span>
                  <ChevronUp className="jd-h-4 jd-w-4 jd-transition-transform group-hover:jd-rotate-180" />
                </>
              ) : (
                <>
                  <Eye className="jd-h-4 jd-w-4 jd-transition-transform group-hover:jd-scale-110" />
                  <span>Show Preview</span>
                  <ChevronDown className="jd-h-4 jd-w-4 jd-transition-transform group-hover:jd-rotate-180" />
                </>
              )}
            </div>
          </Button>
        </div>

        {/* Animated preview section */}
        <div
          className={cn(
            'jd-overflow-hidden jd-transition-all jd-duration-500 jd-ease-in-out',
            showPreview ? 'jd-max-h-[500px] jd-opacity-100' : 'jd-max-h-0 jd-opacity-0'
          )}
        >
          <div className="jd-space-y-3 jd-pt-4">
            <TemplatePreview
              metadata={metadata}
              content={content}
              blockContentCache={blockContentCache}
              isDarkMode={isDark}
            />
          </div>
        </div>
      </div>
    );
  }

  // For customize mode, show the interface with placeholders and preview
  return (
    <div className="jd-h-full jd-flex jd-flex-1 jd-overflow-hidden">
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
          <div className="jd-h-full jd-border jd-rounded-md jd-p-4 jd-overflow-hidden jd-flex jd-flex-col">
            <TemplatePreview
              metadata={metadata}
              content={previewContent} // Use content with placeholders replaced
              blockContentCache={blockContentCache}
              isDarkMode={isDark}
              className="jd-h-full jd-overflow-auto"
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

// Simplified Placeholder Panel Component
const PlaceholderPanel: React.FC<{
  placeholders: Placeholder[];
  onUpdatePlaceholder: (index: number, value: string) => void;
  onResetPlaceholders: () => void;
}> = ({ placeholders, onUpdatePlaceholder, onResetPlaceholders }) => {
  const filledCount = placeholders.filter(p => p.value.trim()).length;
  const totalCount = placeholders.length;

  return (
    <div className="jd-h-full jd-space-y-4 jd-overflow-y-auto jd-p-4">
      <div className="jd-flex jd-items-center jd-justify-between jd-mb-2">
        <h3 className="jd-text-sm jd-font-medium">
          Replace Placeholders
          {totalCount > 0 && (
            <span className="jd-ml-2 jd-text-xs jd-text-muted-foreground">
              ({filledCount}/{totalCount} filled)
            </span>
          )}
        </h3>
        
        {filledCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetPlaceholders}
            className="jd-h-7 jd-px-2 jd-text-xs jd-text-muted-foreground hover:jd-text-foreground"
            title="Reset all placeholders"
          >
            Reset
          </Button>
        )}
      </div>
      
      {placeholders.length > 0 ? (
        <div className="jd-space-y-4">
          {placeholders.map((placeholder, idx) => (
            <div key={placeholder.key + idx} className="jd-space-y-1">
              <label className="jd-text-sm jd-font-medium jd-flex jd-items-center">
                <span className={`jd-px-2 jd-py-1 jd-rounded jd-transition-colors ${
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
                placeholder={`Enter value for ${placeholder.key}`}
                className="jd-w-full"
                onKeyDown={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="jd-text-muted-foreground jd-text-center jd-py-8">
          No placeholders found
        </div>
      )}
    </div>
  );
};