// src/components/dialogs/prompts/editors/AdvancedEditor/index.tsx - Enhanced Version
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';

import { MetadataSection } from './MetadataSection';
import { useTemplateEditor } from '../../TemplateEditorDialog/TemplateEditorContext';
import EditablePromptPreview from '@/components/prompts/EditablePromptPreview';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

interface AdvancedEditorProps {
  isProcessing?: boolean;
}

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  isProcessing = false
}) => {
  const {
    metadata,
    content,
    setContent,
    finalPromptContent,
    setFinalPromptContent,
    availableMetadataBlocks,
    blockContentCache,
    blockRanges
  } = useTemplateEditor();
  const isDarkMode = useThemeDetector();
  const [showPreview, setShowPreview] = useState(true); // Show by default in advanced mode

  const [pendingContent, setPendingContent] = useState(content);
  const [hasPendingContentChanges, setHasPendingContentChanges] = useState(false);

  useEffect(() => {
    setPendingContent(content);
    setHasPendingContentChanges(false);
  }, [content]);

  const handleContentChangeEnhanced = useCallback((value: string) => {
    setPendingContent(value);
    setHasPendingContentChanges(value !== content);
  }, [content]);

  const commitContentChanges = useCallback(() => {
    if (hasPendingContentChanges) {
      setContent(pendingContent);
      setHasPendingContentChanges(false);
    }
  }, [hasPendingContentChanges, setContent, pendingContent]);

  useEffect(() => {
    return () => {
      commitContentChanges();
    };
  }, [commitContentChanges]);

  // **NEW: Use final content if available**
  const displayContent = finalPromptContent || content;

  // **NEW: Handle final content changes**
  const handleFinalContentChangeInternal = useCallback((newContent: string) => {
    setFinalPromptContent(newContent);
  }, [setFinalPromptContent]);

  const hasPendingChanges = hasPendingContentChanges;

  const togglePreview = () => {
    setShowPreview(prev => !prev);
  };

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
        'jd-h-full jd-flex jd-flex-col jd-relative jd-overflow-hidden jd-space-y-6',
        isDarkMode
          ? 'jd-bg-gradient-to-br jd-from-gray-900 jd-via-gray-800 jd-to-gray-900'
          : 'jd-bg-gradient-to-br jd-from-slate-50 jd-via-white jd-to-slate-100'
      )}
    >
      <div className="jd-relative jd-z-10 jd-flex-1 jd-flex jd-flex-col jd-space-y-6 jd-p-6 jd-overflow-y-auto">
        
         {/* 1. PRIMARY METADATA SECTION */}
        <div className="jd-flex-shrink-0">
          <MetadataSection
            availableMetadataBlocks={availableMetadataBlocks}
            showPrimary={true}
            showSecondary={false}
          />
        </div>

        {/* 2. MAIN CONTENT SECTION */}
        <div className="jd-flex-shrink-0">
          <div className="jd-space-y-3">
            <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
              <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-blue-500 jd-to-purple-600 jd-rounded-full"></span>
              Main Content
              {hasPendingChanges && (
                <span className="jd-inline-flex jd-items-center jd-gap-1 jd-text-xs jd-text-amber-600 jd-bg-amber-50 jd-px-2 jd-py-1 jd-rounded-full">
                  <span className="jd-w-2 jd-h-2 jd-bg-amber-500 jd-rounded-full jd-animate-pulse"></span>
                  Unsaved changes
                </span>
              )}
            </h3>
            <div 
              className={cn(
                'jd-overflow-hidden jd-transition-all jd-duration-500 jd-ease-in-out',
                showPreview ? 'jd-max-h-[600px] jd-opacity-100' : 'jd-max-h-0 jd-opacity-0'
              )}
            >
              <div className={cn(
                'jd-transform jd-transition-all jd-duration-500 jd-ease-in-out',
                showPreview ? 'jd-translate-y-0' : 'jd--translate-y-4'
              )}>
                <div className="jd-space-y-3 jd-pt-4">
                  <EditablePromptPreview
                    metadata={metadata}
                    blockContentCache={blockContentCache}
                    isDarkMode={isDarkMode}
                    finalPromptContent={displayContent}
                    onFinalContentChange={handleFinalContentChangeInternal}
                    blockRanges={blockRanges}
                    className="jd-max-h-[500px] jd-overflow-auto"
                  />
                </div>
              </div>
            </div>
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