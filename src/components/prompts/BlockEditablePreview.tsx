import React from 'react';
import { cn } from '@/core/utils/classNames';
import EditablePromptPreview from './EditablePromptPreview';
import { PromptMetadata, MetadataType } from '@/types/prompts/metadata';
import { convertMetadataToVirtualBlocks } from '@/utils/templates/enhancedPreviewUtils';
import { buildPromptPartHtml, getBlockTextColors, getBlockTypeLabel } from '@/utils/prompts/blockUtils';

interface BlockEditablePreviewProps {
  metadata: PromptMetadata;
  content: string;
  blockContentCache?: Record<number, string>;
  isDarkMode: boolean;
  className?: string;
  onContentChange?: (value: string) => void;
}

const ORDER: MetadataType[] = [
  'role',
  'context',
  'goal',
  'audience',
  'tone_style',
  'output_format',
  'constraint',
  'example'
];

export const BlockEditablePreview: React.FC<BlockEditablePreviewProps> = ({
  metadata,
  content,
  blockContentCache = {},
  isDarkMode,
  className,
  onContentChange
}) => {
  const virtualBlocks = React.useMemo(
    () => convertMetadataToVirtualBlocks(metadata, blockContentCache),
    [metadata, blockContentCache]
  );

  const ordered = React.useMemo(
    () =>
      [...virtualBlocks].sort(
        (a, b) => ORDER.indexOf(a.type as MetadataType) - ORDER.indexOf(b.type as MetadataType)
      ),
    [virtualBlocks]
  );

  return (
    <div className={cn('jd-space-y-3 jd-h-full jd-flex jd-flex-col jd-overflow-y-auto', className)}>
      {ordered.map(block => (
        <div
          key={block.id}
          className="jd-relative jd-p-2 jd-rounded jd-border jd-border-transparent hover:jd-border-dashed hover:jd-border-primary/40"
        >
          <div
            dangerouslySetInnerHTML={{
              __html: buildPromptPartHtml(block.type, block.content, isDarkMode)
            }}
          />
          <div className="jd-text-xs jd-text-muted-foreground jd-mt-1">
            <span className={getBlockTextColors(block.type, isDarkMode)}>
              {getBlockTypeLabel(block.type)}
            </span>
          </div>
        </div>
      ))}

      <EditablePromptPreview
        content={content}
        onChange={onContentChange}
        isDark={isDarkMode}
        showColors
      />
    </div>
  );
};

export default BlockEditablePreview;
