import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Block } from '@/types/prompts/blocks';
import { getBlockTypeIcon, getBlockIconColors, buildPromptPart, BLOCK_TYPE_LABELS } from '@/components/prompts/blocks/blockUtils';

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
    <div className="border rounded-lg p-4 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className={`p-1 rounded ${iconBg}`}>
          <Icon className="h-3 w-3" />
        </span>
        <span className="text-sm font-medium">{title}</span>
        <Badge variant="outline" className="text-xs">
          {BLOCK_TYPE_LABELS[block.type || 'content']}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground pl-6">
        {buildPromptPart(block.type || 'content', content)}
      </div>
    </div>
  );
}
