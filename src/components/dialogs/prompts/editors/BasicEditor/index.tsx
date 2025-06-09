// src/components/dialogs/prompts/editors/BasicEditor/index.tsx - Enhanced with block colors
import React from 'react';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { highlightPlaceholders } from '@/utils/templates/placeholderHelpers';
import EditablePromptPreview from '@/components/prompts/EditablePromptPreview';
import { PromptMetadata } from '@/types/prompts/metadata';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PlaceholderPanel } from './PlaceholderPanel';
import { ContentEditor } from './ContentEditor';
import { useBasicEditorLogic } from '@/hooks/prompts/editors/useBasicEditorLogic';
import { getBlockTextColors } from '@/components/prompts/blocks/blockUtils';

interface BasicEditorProps {
  content: string;
  metadata?: PromptMetadata;
  onContentChange: (content: string) => void;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
  mode?: 'create' | 'customize';
  isProcessing?: boolean;
}

// Helper functions for colored preview (same as AdvancedEditor)
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const buildColoredPreviewHtml = (content: string, isDarkMode: boolean): string => {
  if (!content) {
    return '<span class="jd-text-muted-foreground jd-italic">Your prompt will appear here...</span>';
  }

  // Enhanced pattern matching for block types with colors
  let htmlContent = escapeHtml(content);

  // Apply colored prefixes for common patterns
  const patterns = [
    { 
      regex: /(Ton rôle est de|Role:|Rôle:)/gi, 
      blockType: 'role' 
    },
    { 
      regex: /(Le contexte est|Context:|Contexte:)/gi, 
      blockType: 'context' 
    },
    { 
      regex: /(Ton objectif est|Goal:|Objectif:)/gi, 
      blockType: 'goal' 
    },
    { 
      regex: /(L'audience ciblée est|Audience:|Public cible:)/gi, 
      blockType: 'audience' 
    },
    { 
      regex: /(Le format attendu est|Output format:|Format de sortie:)/gi, 
      blockType: 'output_format' 
    },
    { 
      regex: /(Le ton et style sont|Tone:|Style:)/gi, 
      blockType: 'tone_style' 
    },
    { 
      regex: /(Contrainte:|Constraint:)/gi, 
      blockType: 'constraint' 
    },
    { 
      regex: /(Exemple:|Example:)/gi, 
      blockType: 'example' 
    }
  ];

  // Apply colors to each pattern
  patterns.forEach(({ regex, blockType }) => {
    const colorClass = getBlockTextColors(blockType as any, isDarkMode);
    htmlContent = htmlContent.replace(regex, (match) => {
      return `<span class="${colorClass} jd-font-semibold">${match}</span>`;
    });
  });

  // Convert line breaks
  htmlContent = htmlContent.replace(/\n/g, '<br>');

  // Apply placeholder highlighting
  htmlContent = htmlContent.replace(/\[([^\]]+)\]/g, 
    '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
  );

  return htmlContent;
};

/**
 * Basic editor mode - Simple placeholder and content editing with enhanced preview consistency and colors
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
  
  // Build colored HTML preview
  const coloredPreviewHtml = buildColoredPreviewHtml(modifiedContent, isDark);

  if (isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full" />
        <span className="jd-ml-3 jd-text-gray-600">Loading template...</span>
      </div>
    );
  }

  // For create mode, show only the editor with colored preview below
  if (mode === 'create') {
    return (
      <div className="jd-h-full jd-flex jd-flex-col jd-p-4 jd-space-y-4">
        <div className="jd-flex-shrink-0">
          <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2 jd-mb-2">
            <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-blue-500 jd-to-purple-600 jd-rounded-full"></span>
            Edit Template
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
        
        {/* Enhanced Preview Section with Colors */}
        <div className="jd-flex-shrink-0 jd-pt-4 jd-border-t">
          <div className="jd-space-y-3">
            <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
              <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-green-500 jd-to-teal-600 jd-rounded-full"></span>
              Preview
              <div className="jd-flex jd-items-center jd-gap-1 jd-text-xs jd-text-muted-foreground jd-ml-auto">
                <span className="jd-inline-block jd-w-3 jd-h-3 jd-bg-yellow-300 jd-rounded"></span>
                <span>Placeholders</span>
              </div>
            </h3>
            <div className="jd-border jd-rounded-lg jd-p-1 jd-bg-gradient-to-r jd-from-green-500/10 jd-to-teal-500/10">
              <EditablePromptPreview
                content={modifiedContent}
                htmlContent={coloredPreviewHtml}
                isDark={isDark}
                // No onChange for read-only preview
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For customize mode, show the full interface with placeholders and colored previews
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
            <div className="jd-flex-shrink-0">
              <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2 jd-mb-2">
                <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-blue-500 jd-to-purple-600 jd-rounded-full"></span>
                Edit Template
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
                className="jd-min-h-[200px]"
              />
            </div>
            
            {/* Enhanced Preview Section with Colors */}
            <div className="jd-flex-shrink-0 jd-mt-4 jd-pt-4 jd-border-t">
              <div className="jd-space-y-3">
                <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
                  <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-green-500 jd-to-teal-600 jd-rounded-full"></span>
                  Preview
                  <div className="jd-flex jd-items-center jd-gap-1 jd-text-xs jd-text-muted-foreground jd-ml-auto">
                    <span className="jd-inline-block jd-w-3 jd-h-3 jd-bg-yellow-300 jd-rounded"></span>
                    <span>Placeholders</span>
                  </div>
                </h3>
                <div className="jd-border jd-rounded-lg jd-p-1 jd-bg-gradient-to-r jd-from-green-500/10 jd-to-teal-500/10">
                  <EditablePromptPreview
                    content={modifiedContent}
                    htmlContent={coloredPreviewHtml}
                    onChange={onContentChange} // Allow editing in customize mode
                    isDark={isDark}
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