// src/components/dialogs/prompts/editors/BasicEditor/index.tsx
import React from 'react';
import { Block } from '@/types/prompts/blocks';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

import { PlaceholderPanel } from './PlaceholderPanel';
import { ContentEditor } from './ContentEditor';
import { useBasicEditorLogic } from '@/hooks/prompts/editors/useBasicEditorLogic';

interface BasicEditorProps {
  blocks: Block[];
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  mode?: 'create' | 'customize';
}

/**
 * Basic editor mode - Simple placeholder and content editing
 * No block logic exposed to the user
 */
export const BasicEditor: React.FC<BasicEditorProps> = ({
  blocks,
  onUpdateBlock,
  mode = 'customize'
}) => {
  const {
    // State
    placeholders,
    modifiedContent,
    contentMounted,
    isEditing,
    
    // Refs
    editorRef,
    observerRef,
    inputRefs,
    activeInputIndex,
    
    // Content management
    templateContent,
    
    // Event handlers
    handleEditorFocus,
    handleEditorBlur,
    handleEditorInput,
    handleEditorKeyDown,
    handleEditorKeyPress,
    handleEditorKeyUp,
    updatePlaceholder
  } = useBasicEditorLogic({
    blocks,
    onUpdateBlock,
    mode
  });

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
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};