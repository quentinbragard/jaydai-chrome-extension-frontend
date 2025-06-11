// src/components/dialogs/prompts/editors/AdvancedEditor/index.tsx - Updated
import React, { useState, useMemo, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import {
  PromptMetadata,
  MetadataType,
  SingleMetadataType,
  MultipleMetadataType,
  MetadataItem,
  Block,
  BlockType
} from '@/types/prompts/metadata';
import { MetadataSection } from './MetadataSection';
import EditablePromptPreview from '@/components/prompts/EditablePromptPreview';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

interface MetadataHandlers {
  updateSingleMetadataValue: (type: SingleMetadataType, value: string) => void;
  updateCustomMetadataValue: (type: SingleMetadataType, value: string) => void;
  addMultipleMetadataItem: (type: MultipleMetadataType) => void;
  removeMultipleMetadataItem: (type: MultipleMetadataType, itemId: string) => void;
  updateMultipleMetadataItem: (type: MultipleMetadataType, itemId: string, updates: Partial<MetadataItem>) => void;
  reorderMultipleMetadataItems: (type: MultipleMetadataType, newItems: MetadataItem[]) => void;
  addSecondaryMetadataType: (type: MetadataType) => void;
  removeSecondaryMetadataType: (type: MetadataType) => void;
}

interface MetadataUIState {
  expandedMetadata: MetadataType | null;
  setExpandedMetadata: (type: MetadataType | null) => void;
  activeSecondaryMetadata: Set<MetadataType>;
  metadataCollapsed: boolean;
  setMetadataCollapsed: (collapsed: boolean) => void;
  secondaryMetadataCollapsed: boolean;
  setSecondaryMetadataCollapsed: (collapsed: boolean) => void;
  customValues: Record<string, string>;
}

interface AdvancedEditorProps {
  content: string;
  onContentChange: (value: string) => void;
  isProcessing?: boolean;
  
  // Metadata props - passed down from dialog instead of using context
  resolvedMetadata: PromptMetadata;
  metadataHandlers: MetadataHandlers;
  metadataUIState: MetadataUIState;
  
  // Block-related props passed from dialog
  availableMetadataBlocks?: Record<MetadataType, Block[]>;
  availableBlocksByType?: Record<BlockType, Block[]>;
  blockContentCache?: Record<number, string>;
  onBlockSaved?: (block: Block) => void;
  finalPromptContent?: string;
}

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  content,
  onContentChange,
  isProcessing = false,
  resolvedMetadata,
  metadataHandlers,
  metadataUIState,
  availableMetadataBlocks = {},
  availableBlocksByType = {},
  blockContentCache = {},
  onBlockSaved,
  finalPromptContent
}) => {
  const isDarkMode = useThemeDetector();
  const [showPreview, setShowPreview] = useState(false);

  const {
    expandedMetadata,
    setExpandedMetadata,
    activeSecondaryMetadata,
    metadataCollapsed,
    setMetadataCollapsed,
    secondaryMetadataCollapsed,
    setSecondaryMetadataCollapsed,
    customValues
  } = metadataUIState;

  const {
    updateSingleMetadataValue,
    updateCustomMetadataValue,
    addMultipleMetadataItem,
    removeMultipleMetadataItem,
    updateMultipleMetadataItem,
    reorderMultipleMetadataItems,
    addSecondaryMetadataType,
    removeSecondaryMetadataType
  } = metadataHandlers;
  
  // Use final prompt content if available, otherwise build from current state
  const previewContent = finalPromptContent || content;

  // Build preview HTML using resolved content
  const previewHtml = useMemo(() => {
    if (!previewContent) return '';
    
    // Simple HTML conversion with placeholder highlighting
    return previewContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\[([^\]]+)\]/g,
        '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
      );
  }, [previewContent]);

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
            state={{
              expandedMetadata,
              setExpandedMetadata,
              activeSecondaryMetadata,
              metadataCollapsed,
              setMetadataCollapsed,
              secondaryMetadataCollapsed,
              setSecondaryMetadataCollapsed
            }}
            handlers={{
              onSingleMetadataChange: updateSingleMetadataValue,
              onCustomChange: updateCustomMetadataValue,
              onAddMetadataItem: addMultipleMetadataItem,
              onRemoveMetadataItem: removeMultipleMetadataItem,
              onUpdateMetadataItem: updateMultipleMetadataItem,
              onReorderMetadataItems: reorderMultipleMetadataItems,
              onAddSecondaryMetadata: addSecondaryMetadataType,
              onRemoveSecondaryMetadata: removeSecondaryMetadataType,
              onSaveBlock: onBlockSaved ?? (() => {})
            }}
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
            </h3>
            <div className="jd-relative">
              <Textarea
                value={content}
                onChange={e => onContentChange(e.target.value)}
                className="!jd-min-h-[200px] jd-text-sm jd-resize-none jd-transition-all jd-duration-200 focus:jd-ring-2 focus:jd-ring-primary/50"
                placeholder="Enter your main prompt content here..."
                onKeyDown={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
              />
              {content && (
                <div className="jd-absolute jd-bottom-2 jd-right-3 jd-text-xs jd-text-muted-foreground jd-bg-background/80 jd-px-2 jd-py-1 jd-rounded">
                  {content.length} characters
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. SECONDARY METADATA SECTION */}
        <div className="jd-flex-shrink-0">
          <MetadataSection
            availableMetadataBlocks={availableMetadataBlocks}
            state={{
              expandedMetadata,
              setExpandedMetadata,
              activeSecondaryMetadata,
              metadataCollapsed,
              setMetadataCollapsed,
              secondaryMetadataCollapsed,
              setSecondaryMetadataCollapsed
            }}
            handlers={{
              onSingleMetadataChange: updateSingleMetadataValue,
              onCustomChange: updateCustomMetadataValue,
              onAddMetadataItem: addMultipleMetadataItem,
              onRemoveMetadataItem: removeMultipleMetadataItem,
              onUpdateMetadataItem: updateMultipleMetadataItem,
              onReorderMetadataItems: reorderMultipleMetadataItems,
              onAddSecondaryMetadata: addSecondaryMetadataType,
              onRemoveSecondaryMetadata: removeSecondaryMetadataType,
              onSaveBlock: onBlockSaved ?? (() => {})
            }}
            showPrimary={false}
            showSecondary={true}
          />
        </div>

        {/* 4. PREVIEW TOGGLE BUTTON */}
        <div className="jd-flex-shrink-0 jd-pt-4 jd-border-t">
          <Button
            onClick={togglePreview}
            variant="outline"
            className={cn(
              'jd-w-full jd-transition-all jd-duration-300 jd-group',
              'hover:jd-shadow-lg hover:jd-scale-[1.02]',
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
              </div>
            </div>
          </Button>
        </div>

        {/* 5. ANIMATED PREVIEW SECTION */}
        <div 
          className={cn(
            'jd-overflow-hidden jd-transition-all jd-duration-500 jd-ease-in-out',
            showPreview ? 'jd-max-h-[500px] jd-opacity-100' : 'jd-max-h-0 jd-opacity-0'
          )}
        >
          <div className={cn(
            'jd-transform jd-transition-all jd-duration-500 jd-ease-in-out',
            showPreview ? 'jd-translate-y-0' : 'jd--translate-y-4'
          )}>
            <div className="jd-space-y-3 jd-pt-4">
              <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
                <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-green-500 jd-to-teal-600 jd-rounded-full jd-animate-pulse"></span>
                Final Preview
                <div className="jd-text-xs jd-text-muted-foreground jd-ml-auto">
                  {finalPromptContent ? 'Using resolved content' : 'Using current state'}
                </div>
              </h3>
              <div className="jd-border jd-rounded-lg jd-p-1 jd-bg-gradient-to-r jd-from-green-500/20 jd-to-teal-500/20">
                <EditablePromptPreview
                  content={previewContent}
                  htmlContent={previewHtml}
                  isDark={isDarkMode}
                  enableAdvancedEditing={false} // Read-only in advanced editor
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};