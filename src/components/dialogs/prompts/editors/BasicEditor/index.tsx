// src/components/dialogs/prompts/editors/BasicEditor/index.tsx - Enhanced with metadata preview
import React, { useMemo } from 'react';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import EditablePromptPreview from '@/components/prompts/EditablePromptPreview';
import { PromptMetadata, DEFAULT_METADATA } from '@/types/prompts/metadata';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PlaceholderPanel } from './PlaceholderPanel';
import { ContentEditor } from './ContentEditor';
import { useBasicEditorLogic } from '@/hooks/prompts/editors/useBasicEditorLogic';
import { getBlockTypeLabel, getBlockTextColors } from '@/components/prompts/blocks/blockUtils';

interface BasicEditorProps {
  content: string;
  metadata?: PromptMetadata;
  onContentChange: (content: string) => void;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
  mode?: 'create' | 'customize';
  isProcessing?: boolean;
}

// Helper functions for building complete preview with metadata
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const getBlockTypeLabelHtml = (type: string, isDarkMode: boolean): string => {
  const prefix = getBlockTypeLabel(type);
  if (!prefix) return '';
  
  // Map metadata types to block types for consistent coloring
  const typeMapping: Record<string, string> = {
    role: 'role',
    context: 'context', 
    goal: 'goal',
    audience: 'audience',
    output_format: 'output_format',
    tone_style: 'tone_style'
  };
  
  const blockType = typeMapping[type] || 'custom';
  const colorClass = getBlockTextColors(blockType as any, isDarkMode);
  
  return `<span class="${colorClass} jd-font-semibold">${escapeHtml(prefix)}</span>`;
};

// Build metadata-only preview (without main content)
const buildMetadataOnlyPreview = (metadata: PromptMetadata): string => {
  const parts: string[] = [];

  // Add primary metadata
  ['role', 'context', 'goal'].forEach(type => {
    const value = metadata.values?.[type];
    if (value?.trim()) {
      const prefix = getBlockTypeLabel(type);
      parts.push(prefix ? `${prefix} ${value}` : value);
    }
  });

  // Add secondary metadata (only if they exist in metadata)
  ['audience', 'output_format', 'tone_style'].forEach(type => {
    const value = metadata.values?.[type];
    if (value?.trim()) {
      const prefix = getBlockTypeLabel(type);
      parts.push(prefix ? `${prefix} ${value}` : value);
    }
  });

  // Add constraints
  if (metadata.constraints && metadata.constraints.length > 0) {
    metadata.constraints.forEach(item => {
      if (item.value.trim()) {
        parts.push(`Contrainte: ${item.value}`);
      }
    });
  }

  // Add examples
  if (metadata.examples && metadata.examples.length > 0) {
    metadata.examples.forEach(item => {
      if (item.value.trim()) {
        parts.push(`Exemple: ${item.value}`);
      }
    });
  }

  return parts.filter(Boolean).join('\n\n');
};

// Extract content from complete template by removing metadata part
const extractContentFromCompleteTemplate = (completeTemplate: string, metadataPart: string): string => {
  if (!metadataPart) {
    // No metadata, so the complete template is the content
    return completeTemplate;
  }
  
  // If the complete template starts with the metadata part, extract what comes after
  if (completeTemplate.startsWith(metadataPart)) {
    const contentPart = completeTemplate.substring(metadataPart.length).trim();
    // Remove leading line breaks
    return contentPart.replace(/^\n+/, '');
  }
  
  // If it doesn't start with metadata (user might have edited metadata), 
  // try to find where the content starts by looking for the last recognizable metadata block
  const metadataKeywords = [
    'Ton rôle est de', 'Le contexte est', 'Ton objectif est',
    'L\'audience ciblée est', 'Le format attendu est', 'Le ton et style sont',
    'Contrainte:', 'Exemple:'
  ];
  
  const lines = completeTemplate.split('\n\n');
  let contentStartIndex = 0;
  
  // Find the last line that starts with a metadata keyword
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    const startsWithMetadata = metadataKeywords.some(keyword => line.startsWith(keyword));
    if (startsWithMetadata) {
      contentStartIndex = i + 1;
      break;
    }
  }
  
  // Extract content from that point onward
  if (contentStartIndex < lines.length) {
    return lines.slice(contentStartIndex).join('\n\n').trim();
  }
  
  // Fallback: return the last part that doesn't look like metadata
  const lastLine = lines[lines.length - 1];
  const looksLikeMetadata = metadataKeywords.some(keyword => lastLine.startsWith(keyword));
  return looksLikeMetadata ? '' : lastLine;
};
// Build complete preview with metadata + content
const buildCompletePreview = (metadata: PromptMetadata, content: string): string => {
  const parts: string[] = [];

  // Debug: Check if metadata has any values
  console.log('BasicEditor metadata:', metadata);
  console.log('Metadata values:', metadata.values);

  // Add primary metadata
  ['role', 'context', 'goal'].forEach(type => {
    const value = metadata.values?.[type];
    console.log(`Checking ${type}:`, value);
    if (value?.trim()) {
      const prefix = getBlockTypeLabel(type);
      parts.push(prefix ? `${prefix} ${value}` : value);
    }
  });

  // Add secondary metadata (only if they exist in metadata)
  ['audience', 'output_format', 'tone_style'].forEach(type => {
    const value = metadata.values?.[type];
    if (value?.trim()) {
      const prefix = getBlockTypeLabel(type);
      parts.push(prefix ? `${prefix} ${value}` : value);
    }
  });

  // Add constraints
  if (metadata.constraints && metadata.constraints.length > 0) {
    metadata.constraints.forEach(item => {
      if (item.value.trim()) {
        parts.push(`Contrainte: ${item.value}`);
      }
    });
  }

  // Add examples
  if (metadata.examples && metadata.examples.length > 0) {
    metadata.examples.forEach(item => {
      if (item.value.trim()) {
        parts.push(`Exemple: ${item.value}`);
      }
    });
  }

  // Add main content
  if (content.trim()) {
    parts.push(content);
  }

  const result = parts.filter(Boolean).join('\n\n');
  console.log('Final preview parts:', parts);
  console.log('Final preview result:', result);
  
  return result;
};

// Build complete HTML preview with metadata + content
const buildCompletePreviewHtml = (metadata: PromptMetadata, content: string, isDarkMode: boolean): string => {
  const parts: string[] = [];

  // Add primary metadata with colors
  ['role', 'context', 'goal'].forEach(type => {
    const value = metadata.values?.[type];
    if (value?.trim()) {
      const prefixHtml = getBlockTypeLabelHtml(type, isDarkMode);
      const escapedContent = escapeHtml(value);
      parts.push(prefixHtml ? `${prefixHtml} ${escapedContent}` : escapedContent);
    }
  });

  // Add secondary metadata with colors
  ['audience', 'output_format', 'tone_style'].forEach(type => {
    const value = metadata.values?.[type];
    if (value?.trim()) {
      const prefixHtml = getBlockTypeLabelHtml(type, isDarkMode);
      const escapedContent = escapeHtml(value);
      parts.push(prefixHtml ? `${prefixHtml} ${escapedContent}` : escapedContent);
    }
  });

  // Add constraints with colors
  if (metadata.constraints && metadata.constraints.length > 0) {
    metadata.constraints.forEach(item => {
      if (item.value.trim()) {
        const colorClass = getBlockTextColors('constraint', isDarkMode);
        const prefixHtml = `<span class="${colorClass} jd-font-semibold">Contrainte:</span>`;
        parts.push(`${prefixHtml} ${escapeHtml(item.value)}`);
      }
    });
  }

  // Add examples with colors
  if (metadata.examples && metadata.examples.length > 0) {
    metadata.examples.forEach(item => {
      if (item.value.trim()) {
        const colorClass = getBlockTextColors('example', isDarkMode);
        const prefixHtml = `<span class="${colorClass} jd-font-semibold">Exemple:</span>`;
        parts.push(`${prefixHtml} ${escapeHtml(item.value)}`);
      }
    });
  }

  // Add main content
  if (content.trim()) {
    parts.push(escapeHtml(content));
  }

  if (parts.length === 0) {
    return '<span class="jd-text-muted-foreground jd-italic">Your prompt will appear here...</span>';
  }

  // Convert to HTML and add placeholder highlighting
  const htmlContent = parts.join('<br><br>');
  return htmlContent.replace(/\[([^\]]+)\]/g, 
    '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
  );
};

/**
 * Basic editor mode - Simple placeholder and content editing with complete metadata preview
 */
export const BasicEditor: React.FC<BasicEditorProps> = ({
  content,
  metadata = DEFAULT_METADATA,
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
  
  // Build complete preview including metadata + content
  const completePreviewText = useMemo(() => {
    return buildCompletePreview(metadata, modifiedContent);
  }, [metadata, modifiedContent]);
  
  const completePreviewHtml = useMemo(() => {
    return buildCompletePreviewHtml(metadata, modifiedContent, isDark);
  }, [metadata, modifiedContent, isDark]);

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
                  </div>
                </h3>
                <div className="jd-text-xs jd-text-muted-foreground jd-mb-2">
                  Complete template preview - click to edit the content part
                </div>
                <div className="jd-border jd-rounded-lg jd-p-1 jd-bg-gradient-to-r jd-from-green-500/10 jd-to-teal-500/10">
                  <EditablePromptPreview
                    content={completePreviewText}
                    htmlContent={completePreviewHtml}
                    onChange={(newCompleteContent) => {
                      // Extract the content part from the edited complete template
                      const originalMetadataPart = buildMetadataOnlyPreview(metadata);
                      const newContent = extractContentFromCompleteTemplate(newCompleteContent, originalMetadataPart);
                      onContentChange(newContent);
                    }}
                    isDark={isDark}
                    showColors={true}
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