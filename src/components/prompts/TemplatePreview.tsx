// src/components/prompts/TemplatePreview.tsx - Simplified Version
import React from 'react';
import { cn } from '@/core/utils/classNames';
import { PromptMetadata } from '@/types/prompts/metadata';
import { buildCompletePreviewWithBlocks, buildCompletePreviewHtmlWithBlocks } from '@/utils/templates/promptPreviewUtils';

interface TemplatePreviewProps {
  metadata: PromptMetadata;
  content: string;
  blockContentCache?: Record<number, string>;
  isDarkMode: boolean;
  className?: string;
  title?: string;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  metadata,
  content,
  blockContentCache = {},
  isDarkMode,
  className,
  title = "Template Preview"
}) => {
  // Build the complete preview HTML
  const previewHtml = React.useMemo(() => {
    if (Object.keys(blockContentCache).length > 0) {
      return buildCompletePreviewHtmlWithBlocks(metadata, content, blockContentCache, isDarkMode);
    }
    
    // Fallback to basic preview building
    const parts: string[] = [];
    
    // Add metadata parts
    const singleTypes = ['role', 'context', 'goal', 'audience', 'output_format', 'tone_style'];
    singleTypes.forEach(type => {
      const value = metadata.values?.[type as keyof typeof metadata.values];
      if (value?.trim()) {
        parts.push(value);
      }
    });
    
    // Add constraint and example
    if (metadata.constraint) {
      metadata.constraint.forEach(item => {
        if (item.value.trim()) {
          parts.push(`Contrainte: ${item.value}`);
        }
      });
    }
    
    if (metadata.example) {
      metadata.example.forEach(item => {
        if (item.value.trim()) {
          parts.push(`Exemple: ${item.value}`);
        }
      });
    }
    
    // Add main content
    if (content.trim()) {
      parts.push(content);
    }
    
    const fullContent = parts.join('\n\n');
    
    // Simple HTML formatting
    return fullContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\[([^\]]+)\]/g, '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded">[$1]</span>');
  }, [metadata, content, blockContentCache, isDarkMode]);

  return (
    <div className={cn('jd-space-y-3', className)}>
      {/* Header */}
      <div className="jd-flex jd-items-center jd-gap-2">
        <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
          <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-green-500 jd-to-teal-600 jd-rounded-full"></span>
          {title}
        </h3>
      </div>

      {/* Preview Content - Read Only */}
      <div
        className={cn(
          'jd-min-h-[200px] jd-p-4 jd-rounded-lg jd-border jd-text-sm jd-leading-relaxed',
          'jd-whitespace-pre-wrap jd-break-words jd-overflow-y-auto jd-max-h-[400px]',
          isDarkMode 
            ? 'jd-bg-gray-800 jd-border-gray-700 jd-text-white' 
            : 'jd-bg-white jd-border-gray-200 jd-text-gray-900'
        )}
        dangerouslySetInnerHTML={{ __html: previewHtml }}
      />
      
      {/* Info */}
      <div className="jd-flex jd-justify-between jd-items-center jd-text-xs jd-text-muted-foreground">
        <span>{content.length} characters</span>
        <span>{content.split('\n').length} lines</span>
      </div>
    </div>
  );
};

export default TemplatePreview;