// src/components/prompts/TemplatePreview.tsx - Fixed Version with Proper Scrolling
import React from 'react';
import { cn } from '@/core/utils/classNames';
import { PromptMetadata } from '@/types/prompts/metadata';
import { buildCompletePreviewWithBlocks, buildCompletePreviewHtmlWithBlocks } from '@/utils/templates/promptPreviewUtils';
import { getMessage } from '@/core/utils/i18n';

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
  title = getMessage('templatePreviewTitle', undefined, 'Template Preview')
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
          parts.push(`${getMessage('constraintLabel', undefined, 'Contrainte:')} ${item.value}`);
        }
      });
    }

    if (metadata.example) {
      metadata.example.forEach(item => {
        if (item.value.trim()) {
          parts.push(`${getMessage('exampleLabel', undefined, 'Exemple:')} ${item.value}`);
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
    <div className={cn(
      'jd-h-full jd-flex jd-flex-col jd-min-h-0 jd-overflow-hidden', 
      className
    )}>
      {/* Header - fixed height, no flex grow */}
      <div className="jd-flex jd-items-center jd-gap-2 jd-flex-shrink-0 jd-pb-3">
        <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
          <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-green-500 jd-to-teal-600 jd-rounded-full"></span>
          {title}
        </h3>
      </div>

      {/* Preview Content - This is the scrollable area */}
      <div className="jd-flex-1 jd-min-h-0 jd-overflow-hidden jd-rounded-lg jd-border jd-bg-card">
        <div
          className={cn(
            'jd-h-full jd-w-full jd-p-4 jd-text-sm jd-leading-relaxed',
            'jd-whitespace-pre-wrap jd-break-words jd-overflow-y-auto jd-overflow-x-hidden',
            // Custom scrollbar styling
            'jd-scrollbar-thin jd-scrollbar-thumb-rounded-full jd-scrollbar-track-rounded-full',
            isDarkMode 
              ? 'jd-bg-gray-800 jd-border-gray-700 jd-text-white jd-scrollbar-thumb-gray-600 jd-scrollbar-track-gray-800' 
              : 'jd-bg-white jd-border-gray-200 jd-text-gray-900 jd-scrollbar-thumb-gray-300 jd-scrollbar-track-gray-100'
          )}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
          style={{
            // Ensure consistent scrolling behavior across browsers
            scrollBehavior: 'smooth',
            // Force hardware acceleration for smooth scrolling
            transform: 'translateZ(0)',
            // Prevent content from pushing boundaries
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        />
      </div>
      
      {/* Footer - fixed height, no flex grow */}
      <div className="jd-flex jd-justify-between jd-items-center jd-text-xs jd-text-muted-foreground jd-flex-shrink-0 jd-pt-3">
        <span>{content.length} {getMessage('charactersLabel', undefined, 'characters')}</span>
        <span>{content.split('\n').length} {getMessage('linesLabel', undefined, 'lines')}</span>
      </div>
    </div>
  );
};

export default TemplatePreview;