// src/components/dialogs/prompts/editors/AdvancedEditor/index.tsx
import React, { useState, useEffect } from 'react';
import { Block, BlockType } from '@/types/prompts/blocks';
import { PromptMetadata, DEFAULT_METADATA } from '@/types/prompts/metadata';
import { blocksApi } from '@/services/api/BlocksApi';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { cn } from '@/core/utils/classNames';
import { BLOCK_TYPES } from '../../../prompts/blocks/blockUtils';

import { MetadataSection } from './MetadataSection';
import { SeparatedPreviewSection } from './SeparatedPreviewSection';
import { useAdvancedEditorLogic } from '@/hooks/prompts/editors/useAdvancedEditorLogic';

interface AdvancedEditorProps {
  blocks: Block[];
  metadata?: PromptMetadata;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onReorderBlocks: (blocks: Block[]) => void;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
  isProcessing: boolean;
}

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  blocks,
  metadata = DEFAULT_METADATA,
  onUpdateBlock,
  onReorderBlocks,
  onUpdateMetadata,
  isProcessing
}) => {
  const isDarkMode = useThemeDetector();
  
  const {
    // Available blocks state
    availableMetadataBlocks,
    
    // UI state
    expandedMetadata,
    setExpandedMetadata,
    previewExpanded,
    setPreviewExpanded,
    activeSecondaryMetadata,
    
    // Collapsible sections
    metadataCollapsed,
    setMetadataCollapsed,
    secondaryMetadataCollapsed,
    setSecondaryMetadataCollapsed,
    
    // Metadata handlers
    handleSingleMetadataChange,
    handleCustomChange,
    handleAddMetadataItem,
    handleRemoveMetadataItem,
    handleUpdateMetadataItem,
    handleReorderMetadataItems,
    addSecondaryMetadata,
    removeSecondaryMetadata,
    
    // Block handlers
    handleBlockSaved,
    handleMetadataBlockSaved,
    
    // Preview content generation
    generatePreviewContent,
    generatePreviewHtml,
    
    // Get metadata block mapping for template saving
    getMetadataBlockMapping
  } = useAdvancedEditorLogic({
    metadata,
    onUpdateMetadata,
    blocks,
    onUpdateBlock,
    onReorderBlocks
  });

  if (isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full"></div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'jd-h-full jd-flex jd-flex-col jd-relative jd-overflow-hidden jd-space-y-4',
        isDarkMode
          ? 'jd-bg-gradient-to-br jd-from-gray-900 jd-via-gray-800 jd-to-gray-900'
          : 'jd-bg-gradient-to-br jd-from-slate-50 jd-via-white jd-to-slate-100'
      )}
    >
      {/* Animated background mesh */}
      <div className="jd-absolute jd-inset-0 jd-opacity-10">
        <div className={cn(
          'jd-absolute jd-inset-0',
          isDarkMode
            ? 'jd-bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] jd-from-purple-900 jd-via-transparent jd-to-transparent'
            : 'jd-bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] jd-from-purple-200 jd-via-transparent jd-to-transparent'
        )}></div>
        <div className={cn(
          'jd-absolute jd-inset-0',
          isDarkMode
            ? 'jd-bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] jd-from-blue-900 jd-via-transparent jd-to-transparent'
            : 'jd-bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] jd-from-blue-200 jd-via-transparent jd-to-transparent'
        )}></div>
      </div>

      {/* Content wrapper */}
      <div className="jd-relative jd-z-10 jd-flex-1 jd-flex jd-flex-col jd-space-y-4 jd-p-6 jd-overflow-hidden">
        
        {/* Metadata Section */}
        <MetadataSection
          availableMetadataBlocks={availableMetadataBlocks}
          metadata={metadata}
          expandedMetadata={expandedMetadata}
          setExpandedMetadata={setExpandedMetadata}
          activeSecondaryMetadata={activeSecondaryMetadata}
          metadataCollapsed={metadataCollapsed}
          setMetadataCollapsed={setMetadataCollapsed}
          secondaryMetadataCollapsed={secondaryMetadataCollapsed}
          setSecondaryMetadataCollapsed={setSecondaryMetadataCollapsed}
          onSingleMetadataChange={handleSingleMetadataChange}
          onCustomChange={handleCustomChange}
          onAddMetadataItem={handleAddMetadataItem}
          onRemoveMetadataItem={handleRemoveMetadataItem}
          onUpdateMetadataItem={handleUpdateMetadataItem}
          onReorderMetadataItems={handleReorderMetadataItems}
          onAddSecondaryMetadata={addSecondaryMetadata}
          onRemoveSecondaryMetadata={removeSecondaryMetadata}
          onSaveBlock={handleMetadataBlockSaved}
        />

        {/* Preview Section */}
        {(() => {
          const { before, content, after } = generateSeparatedPreviewHtml();
          return (
            <SeparatedPreviewSection
              beforeHtml={before}
              contentHtml={content}
              afterHtml={after}
            />
          );
        })()}
      </div>
    </div>
  );
};