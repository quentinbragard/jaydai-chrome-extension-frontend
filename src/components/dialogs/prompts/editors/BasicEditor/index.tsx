// src/components/dialogs/prompts/editors/BasicEditor/index.tsx - Updated Version
import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/utils/classNames';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { useTemplateEditor } from '../../TemplateEditorDialog/TemplateEditorContext';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PlaceholderPanel } from './PlaceholderPanel';
import { ContentEditor } from './ContentEditor';
import { useBasicEditorLogic } from '@/hooks/prompts/editors/useBasicEditorLogic';
import TemplatePreview from '@/components/prompts/TemplatePreview';

interface BasicEditorProps {
  mode?: 'create' | 'customize';
  isProcessing?: boolean;
}

/**
 * Basic editor mode - Simple placeholder and content editing with complete metadata preview
 */
export const BasicEditor: React.FC<BasicEditorProps> = ({
  mode = 'customize',
  isProcessing = false
}) => {
  const {
    metadata,
    content,
    setContent,
    finalPromptContent,
    setFinalPromptContent,
    blockContentCache
  } = useTemplateEditor();
  
  const {
    // State
    placeholders,
    modifiedContent,
    contentMounted,
    isEditing,
    
    // Refs
    editorRef,
    inputRefs,
    activeInputIndex,
    
    // Event handlers
    handleEditorFocus,
    handleEditorBlur,
    handleEditorInput,
    handleEditorKeyDown,
    handleEditorKeyPress,
    handleEditorKeyUp,
    updatePlaceholder,
    
    // Enhanced methods
    forceCommitChanges,
    resetPlaceholders, // **NEW: Added reset function**
    getPlaceholderValues, // **NEW: Added getter for placeholder values**
    hasPendingChanges
  } = useBasicEditorLogic({
    content,
    onContentChange: setContent,
    mode
  });

  const isDark = useThemeDetector();
  const [showPreview, setShowPreview] = useState(mode === 'customize'); // Show by default in customize mode
  const togglePreview = () => setShowPreview(prev => !prev);

  // When the editor mounts or when the stored content changes (e.g. after
  // switching tabs), make sure the content editable div reflects the latest
  // modifiedContent. This keeps BasicEditor text in sync with template.content.
  useEffect(() => {
    if (editorRef.current && !isEditing && editorRef.current.textContent !== modifiedContent) {
      editorRef.current.textContent = modifiedContent;
    }
  }, [modifiedContent, isEditing]);

  // Use finalPromptContent if available, but fall back to modifiedContent
  const displayContent = React.useMemo(() => {
    return finalPromptContent || modifiedContent;
  }, [finalPromptContent, modifiedContent]);

  // Sync finalPromptContent changes back to modified content
  useEffect(() => {
    if (finalPromptContent && finalPromptContent !== modifiedContent) {
      // Don't update if the user is actively editing
      if (!isEditing) {
        console.log('BasicEditor: Syncing final content to modified content');
      }
    }
  }, [finalPromptContent, modifiedContent, isEditing]);

  // Handle final content changes
  const handleFinalContentChangeInternal = React.useCallback((newContent: string) => {
    console.log('BasicEditor: Final content changed, length:', newContent?.length);
    setFinalPromptContent(newContent);
  }, [setFinalPromptContent]);

  // Cleanup effect to commit pending changes when component unmounts
  React.useEffect(() => {
    return () => {
      forceCommitChanges();
    };
  }, [forceCommitChanges]);

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
            {hasPendingChanges && (
              <span className="jd-inline-flex jd-items-center jd-gap-1 jd-text-xs jd-text-amber-600 jd-bg-amber-50 jd-px-2 jd-py-1 jd-rounded-full">
                <span className="jd-w-2 jd-h-2 jd-bg-amber-500 jd-rounded-full jd-animate-pulse"></span>
                Unsaved changes
              </span>
            )}
          </h3>
          <ContentEditor
            ref={editorRef}
            mode={mode}
            onFocus={handleEditorFocus}
            onBlur={handleEditorBlur}
            onInput={handleEditorInput}
            onKeyDown={handleEditorKeyDown}
            onKeyPress={handleEditorKeyPress}
            onKeyUp={handleEditorKeyUp}
            className="jd-min-h-[250px]"
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
              content={modifiedContent}
              blockContentCache={blockContentCache}
              isDarkMode={isDark}
              finalPromptContent={displayContent}
              onFinalContentChange={handleFinalContentChangeInternal}
            />
          </div>
        </div>
      </div>
    );
  }

  // For customize mode, show the full interface with placeholders and complete preview
  return (
    <div className="jd-h-full jd-flex jd-flex-1 jd-overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="jd-h-full jd-w-full">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <PlaceholderPanel
            placeholders={placeholders}
            inputRefs={inputRefs}
            activeInputIndex={activeInputIndex}
            onUpdatePlaceholder={updatePlaceholder}
            onResetPlaceholders={resetPlaceholders} // **NEW: Pass reset function**
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={70} minSize={40}>
          <div className="jd-h-full jd-border jd-rounded-md jd-p-4 jd-overflow-hidden jd-flex jd-flex-col">
            
            {/* Enhanced Preview Section with Full Editing Capabilities */}
            <div className="jd-flex-1 jd-min-h-0">
              <TemplatePreview
                metadata={metadata}
                content={modifiedContent}
                blockContentCache={blockContentCache}
                isDarkMode={isDark}
                finalPromptContent={displayContent}
                onFinalContentChange={handleFinalContentChangeInternal}
                editable={false}
                className="jd-h-full jd-overflow-auto"
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};