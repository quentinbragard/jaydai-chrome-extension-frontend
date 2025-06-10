// src/components/dialogs/prompts/editors/BasicEditor/index.tsx - Updated
import React, { useMemo } from 'react';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import EditablePromptPreview from '@/components/prompts/EditablePromptPreview';
import { PromptMetadata, DEFAULT_METADATA } from '@/types/prompts/metadata';
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
  
  // New prop for consistent final content
  finalPromptContent?: string;
}

/**
 * Basic editor mode - Simple placeholder and content editing with complete metadata preview
 * Now uses finalPromptContent for consistency with AdvancedEditor
 */
export const BasicEditor: React.FC<BasicEditorProps> = ({
  content,
  metadata = DEFAULT_METADATA,
  onContentChange,
  onUpdateMetadata,
  mode = 'customize',
  isProcessing = false,
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
  
  // Use final prompt content if provided, otherwise build from current state
  const completePreviewText = useMemo(() => {
    if (finalPromptContent) {
      return finalPromptContent;
    }
    
    // Fallback: build from current metadata and content
    return buildMetadataPreview(metadata, modifiedContent);
  }, [finalPromptContent, metadata, modifiedContent]);
  
  // Build HTML preview with placeholder highlighting
  const completePreviewHtml = useMemo(() => {
    return completePreviewText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\[([^\]]+)\]/g,
        '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
      );
  }, [completePreviewText]);

  if (isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full" />
        <span className="jd-ml-3 jd-text-gray-600">Loading template...</span>
      </div>
    );
  }

  // For create mode, show only the editor with complete preview below
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
        
        {/* Complete Preview Section with Metadata + Content */}
        <div className="jd-flex-shrink-0 jd-pt-4 jd-border-t">
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
              Complete template preview - click to edit the content part
            </div>
            <div className="jd-border jd-rounded-lg jd-p-1 jd-bg-gradient-to-r jd-from-green-500/10 jd-to-teal-500/10">
              <EditablePromptPreview
                content={completePreviewText}
                htmlContent={completePreviewHtml}
                isDark={isDark}
                showColors={true}
                enableAdvancedEditing={true}
                // No onChange for read-only preview in create mode
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

// Helper function to build metadata preview (fallback when finalPromptContent is not available)
function buildMetadataPreview(metadata: PromptMetadata, content: string): string {
  const parts: string[] = [];
  
  // Add metadata values
  const metadataOrder = ['role', 'context', 'goal', 'audience', 'output_format', 'tone_style'];
  metadataOrder.forEach(type => {
    const value = metadata.values?.[type as keyof typeof metadata.values];
    if (value?.trim()) {
      const prefix = getMetadataPrefix(type);
      parts.push(prefix ? `${prefix} ${value}` : value);
    }
  });
  
  // Add constraints
  if (metadata.constraints) {
    metadata.constraints.forEach(constraint => {
      if (constraint.value.trim()) {
        parts.push(`Contrainte: ${constraint.value}`);
      }
    });
  }
  
  // Add examples
  if (metadata.examples) {
    metadata.examples.forEach(example => {
      if (example.value.trim()) {
        parts.push(`Exemple: ${example.value}`);
      }
    });
  }
  
  // Add main content
  if (content?.trim()) {
    parts.push(content.trim());
  }
  
  return parts.filter(Boolean).join('\n\n');
}

function getMetadataPrefix(type: string): string {
  const prefixes: Record<string, string> = {
    role: 'Ton rôle est de',
    context: 'Le contexte est',
    goal: 'Ton objectif est',
    audience: "L'audience ciblée est",
    output_format: 'Le format attendu est',
    tone_style: 'Le ton et style sont'
  };
  return prefixes[type] || '';
}