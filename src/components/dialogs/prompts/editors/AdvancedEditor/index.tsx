import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { PromptMetadata, DEFAULT_METADATA } from '@/types/prompts/metadata';
import { MetadataSection } from './MetadataSection';
import { SeparatedPreviewSection } from './SeparatedPreviewSection';
import { buildCompletePromptPreview } from '@/components/prompts/promptUtils';
import { highlightPlaceholders } from '@/utils/templates/placeholderHelpers';
import { useSimpleMetadata } from '@/hooks/prompts/editors/useSimpleMetadata';

interface AdvancedEditorProps {
  content: string;
  metadata?: PromptMetadata;
  onContentChange: (value: string) => void;
  onUpdateMetadata?: (metadata: PromptMetadata) => void;
  isProcessing?: boolean;
}

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  content,
  metadata = DEFAULT_METADATA,
  onContentChange,
  onUpdateMetadata,
  isProcessing = false
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
    handleSingleMetadataChange,
    handleCustomChange,
    handleAddMetadataItem,
    handleRemoveMetadataItem,
    handleUpdateMetadataItem,
    handleReorderMetadataItems,
    addSecondaryMetadata,
    removeSecondaryMetadata
  } = useSimpleMetadata({ metadata, onUpdateMetadata });

  if (isProcessing) {
    return (
      <div className="jd-flex jd-items-center jd-justify-center jd-h-full">
        <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full" />
      </div>
    );
  }

  const previewHtml = highlightPlaceholders(
    buildCompletePromptPreview(metadata, [{ id: 1, type: 'custom', content }])
  );

  return (
    <div
      className={cn(
        'jd-h-full jd-flex jd-flex-col jd-relative jd-overflow-hidden jd-space-y-4',
        isDarkMode
          ? 'jd-bg-gradient-to-br jd-from-gray-900 jd-via-gray-800 jd-to-gray-900'
          : 'jd-bg-gradient-to-br jd-from-slate-50 jd-via-white jd-to-slate-100'
      )}
    >
      <div className="jd-relative jd-z-10 jd-flex-1 jd-flex jd-flex-col jd-space-y-4 jd-p-6 jd-overflow-y-auto">
        <MetadataSection
          availableMetadataBlocks={{}}
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
          onSaveBlock={() => {}}
        />

        <div className="jd-space-y-2">
          <h3 className="jd-text-lg jd-font-semibold">Main Content</h3>
          <Textarea
            value={content}
            onChange={e => onContentChange(e.target.value)}
            className="jd-min-h-[200px] jd-text-sm jd-resize-none"
            placeholder="Enter prompt content..."
          />
        </div>

        <div className="jd-pt-2">
          <button
            className="jd-px-3 jd-py-2 jd-rounded jd-bg-primary jd-text-primary-foreground hover:jd-bg-primary/90 jd-transition"
            onClick={() => setShowPreview(prev => !prev)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>

        {showPreview && (
          <SeparatedPreviewSection beforeHtml="" contentHtml={previewHtml} afterHtml="" />
        )}
      </div>
    </div>
  );
};
