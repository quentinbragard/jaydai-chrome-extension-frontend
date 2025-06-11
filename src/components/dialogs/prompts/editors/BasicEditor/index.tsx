// src/components/dialogs/prompts/editors/BasicEditor/index.tsx - Updated
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/utils/classNames';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import EditablePromptPreview from '@/components/prompts/EditablePromptPreview';
import { PromptMetadata } from '@/types/prompts/metadata';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PlaceholderPanel } from './PlaceholderPanel';
import { ContentEditor } from './ContentEditor';
import { useBasicEditorLogic } from '@/hooks/prompts/editors/useBasicEditorLogic';
import { formatPromptText, formatPromptHtml } from '@/utils/prompts/promptFormatter';

interface BasicEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  mode?: 'create' | 'customize';
  isProcessing?: boolean;
  
  // Metadata props - passed down from dialog
  metadata: PromptMetadata;
  
  // New prop for consistent final content
  finalPromptContent?: string;
}

/**
 * Basic editor mode - Simple placeholder and content editing with complete metadata preview
 * Now receives metadata as props instead of using context
 */
export const BasicEditor: React.FC<BasicEditorProps> = ({
  content,
  onContentChange,
  mode = 'customize',
  isProcessing = false,
  metadata,
  finalPromptContent
}) => {
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
    updatePlaceholder
  } = useBasicEditorLogic({
    content,
    onContentChange,
    mode
  });

  const isDark = useThemeDetector();
  const [showPreview, setShowPreview] = useState(false);
  const togglePreview = () => setShowPreview(prev => !prev);
  
  // Use final prompt content if provided, otherwise build from current state
  const completePreviewText = useMemo(() => {
    if (finalPromptContent) {
      return finalPromptContent;
    }
    return formatPromptText(metadata, modifiedContent);
  }, [finalPromptContent, metadata, modifiedContent]);
  
  // Build HTML preview with placeholder highlighting
  const completePreviewHtml = useMemo(() => {
    return formatPromptHtml(metadata, modifiedContent, isDark);
  }, [metadata, modifiedContent, isDark]);

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
              <div className="jd-flex jd-items-center jd-gap-1 jd-text-xs jd-ml-auto">
                <span className="jd-inline-block jd-w-3 jd-h-3 jd-bg-yellow-300 jd-rounded"></span>
                <span>Placeholders</span>
                {finalPromptContent && (
                  <span className="jd-text-green-600 jd-ml-2">• Resolved content</span>
                )}
              </div>
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
            <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
              <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-green-500 jd-to-teal-600 jd-rounded-full"></span>
              Complete Template Preview
            </h3>
            <div className="jd-text-xs jd-text-muted-foreground jd-mb-2">
              Complete template preview - click to edit the content part
            </div>
            <div className="jd-border jd-rounded-lg jd-p-1 jd-bg-gradient-to-r jd-from-green-500/10 jd-to-teal-500/10">
              <EditablePromptPreview
                content={completePreviewText}
                htmlContent={completePreviewHtml}
                isDark={isDark}
                showColors={true}
                enableAdvancedEditing={true}
              />
            </div>
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
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={70} minSize={40}>
          <div className="jd-h-full jd-border jd-rounded-md jd-p-4 jd-overflow-hidden jd-flex jd-flex-col">
            
            {/* Complete Preview Section with Metadata + Content */}
            <div className="jd-flex-shrink-0 jd-mt-4 jd-pt-4 jd-border-t">
              <div className="jd-space-y-3">
                <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
                  <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-green-500 jd-to-teal-600 jd-rounded-full"></span>
                  Complete Template Preview
                  <div className="jd-flex jd-items-center jd-gap-1 jd-text-xs jd-text-muted-foreground jd-ml-auto">
                    <span className="jd-inline-block jd-w-3 jd-h-3 jd-bg-yellow-300 jd-rounded"></span>
                    <span>Placeholders</span>
                    {finalPromptContent && (
                      <span className="jd-text-green-600 jd-ml-2">• Resolved content</span>
                    )}
                  </div>
                </h3>
                <div className="jd-text-xs jd-text-muted-foreground jd-mb-2">
                  Complete template preview - edit placeholders on the left to see changes
                </div>
                <div className="jd-border jd-rounded-lg jd-p-1 jd-bg-gradient-to-r jd-from-green-500/10 jd-to-teal-500/10">
                  <EditablePromptPreview
                    content={completePreviewText}
                    htmlContent={completePreviewHtml}
                    onChange={(newCompleteContent) => {
                      // For customize mode, we can extract content changes
                      // but typically we rely on placeholder editing
                      console.log('Preview content changed:', newCompleteContent);
                    }}
                    isDark={isDark}
                    showColors={true}
                    enableAdvancedEditing={false} // Disable direct editing in customize mode
                  />
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};