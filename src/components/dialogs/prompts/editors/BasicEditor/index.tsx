// src/components/dialogs/prompts/editors/BasicEditor/index.tsx
import React from 'react';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { highlightPlaceholders } from '@/utils/templates/placeholderHelpers';
import EditablePromptPreview from '@/components/prompts/EditablePromptPreview';
import { PromptMetadata } from '@/types/prompts/metadata';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PlaceholderPanel } from './PlaceholderPanel';
import { ContentEditor } from './ContentEditor';
import { useBasicEditorLogic } from '@/hooks/prompts/editors/useBasicEditorLogic';

interface BasicEditorProps {
  content: string;
  metadata?: PromptMetadata;
  onContentChange: (content: string) => void;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
  mode?: 'create' | 'customize';
  isProcessing?: boolean;
}

/**
 * Basic editor mode - Simple placeholder and content editing
 * No block logic exposed to the user
 */
export const BasicEditor: React.FC<BasicEditorProps> = ({
  content,
  metadata,
  onContentChange,
  onUpdateMetadata,
  mode = 'customize',
  isProcessing = false
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
  const previewHtml = highlightPlaceholders(modifiedContent);

  if (isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full" />
        <span className="jd-ml-3 jd-text-gray-600">Loading template...</span>
      </div>
    );
  }

  // For create mode, show only the editor without the left panel
  if (mode === 'create') {
    return (
      <div className="jd-h-full jd-flex jd-flex-col jd-p-4">
        <h3 className="jd-text-sm jd-font-medium jd-mb-2">Edit Template</h3>
        <ContentEditor
          ref={editorRef}
          mode={mode}
          onFocus={handleEditorFocus}
          onBlur={handleEditorBlur}
          onInput={handleEditorInput}
          onKeyDown={handleEditorKeyDown}
          onKeyPress={handleEditorKeyPress}
          onKeyUp={handleEditorKeyUp}
          className="jd-flex-1"
        />
      </div>
    );
  }

  // For customize mode, show the full interface with placeholders
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
            <h3 className="jd-text-sm jd-font-medium jd-mb-2">Edit Template</h3>
            <ContentEditor
              ref={editorRef}
              mode={mode}
              onFocus={handleEditorFocus}
              onBlur={handleEditorBlur}
              onInput={handleEditorInput}
              onKeyDown={handleEditorKeyDown}
              onKeyPress={handleEditorKeyPress}
              onKeyUp={handleEditorKeyUp}
              className="jd-flex-1"
            />
            <div className="jd-mt-4">
              <EditablePromptPreview
                content={modifiedContent}
                htmlContent={previewHtml}
                isDark={isDark}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};