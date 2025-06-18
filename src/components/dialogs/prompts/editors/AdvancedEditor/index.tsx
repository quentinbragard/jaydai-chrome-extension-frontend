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
import { useTemplateEditor } from '../../TemplateEditorDialog/TemplateEditorContext';
import { EnhancedEditablePreview } from '@/components/prompts/EnhancedEditablePreview';
import { Eye, EyeOff, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface AdvancedEditorProps {
  content: string;
  onContentChange: (value: string) => void;
  isProcessing?: boolean;
  
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
  availableMetadataBlocks = {},
  blockContentCache,
  finalPromptContent
}) => {
  const isDarkMode = useThemeDetector();
  const [showPreview, setShowPreview] = useState(true); // Show by default in advanced mode
  const { metadata } = useTemplateEditor();

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
            <div className="jd-relative">
              <Textarea
                value={pendingContentRef.current}
                onChange={e => handleContentChangeEnhanced(e.target.value)}
                className="!jd-min-h-[200px] jd-text-sm jd-resize-none jd-transition-all jd-duration-200 focus:jd-ring-2 focus:jd-ring-primary/50"
                placeholder="Enter your main prompt content here..."
                onKeyDown={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
              />
              {pendingContentRef.current && (
                <div className="jd-absolute jd-bottom-2 jd-right-3 jd-text-xs jd-text-muted-foreground jd-bg-background/80 jd-px-2 jd-py-1 jd-rounded">
                  {pendingContentRef.current.length} characters
                  {hasPendingContentChanges && (
                    <span className="jd-text-amber-600 jd-ml-2">• Modified</span>
                  )}
                </div>
              )}
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
                <span>Editable</span>
              </div>
            </div>
          </Button>
        </div>

        {/* 5. ANIMATED PREVIEW SECTION WITH FULL EDITING */}
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
              <EnhancedEditablePreview
                metadata={metadata}
                content={content}
                blockContentCache={blockContentCache}
                isDarkMode={isDarkMode}
                onContentChange={onContentChange}
                title="Final Preview"
                collapsible={false}
                className="jd-max-h-[500px] jd-overflow-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};