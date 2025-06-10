import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Block } from '@/types/prompts/blocks';
import { getBlockTypeIcon, getBlockIconColors, buildPromptPartHtml, BLOCK_TYPE_LABELS } from '@/utils/prompts/blockUtils';

export interface PreviewBlockProps {
  block: Block;
  isDark: boolean;
}

export function PreviewBlock({ block, isDark }: PreviewBlockProps) {
  const Icon = getBlockTypeIcon(block.type);
  const iconBg = getBlockIconColors(block.type, isDark);
  const title = typeof block.title === 'string' ? block.title : block.title?.en || 'Untitled';
  const content = typeof block.content === 'string' ? block.content : block.content.en || '';

  return (
    <div className="jd-border jd-rounded-lg jd-p-4 jd-bg-background/50 jd-backdrop-blur-sm">
      <div className="jd-flex jd-items-center jd-gap-2 jd-mb-2">
        <span className={`jd-p-1 jd-rounded ${iconBg}`}>
          <Icon className="jd-h-3 jd-w-3" />
        </span>
        <span className="jd-text-sm jd-font-medium">{title}</span>
        <Badge variant="outline" className="jd-text-xs">
          {BLOCK_TYPE_LABELS[block.type || 'custom']}
        </Badge>
      </div>
      <div
        className="jd-text-sm jd-text-muted-foreground jd-pl-6"
        dangerouslySetInnerHTML={{
          __html: buildPromptPartHtml(block.type || 'custom', content, isDark),
        }}
      />
    </div>
  );
}
