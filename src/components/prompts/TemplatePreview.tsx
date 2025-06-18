import React from 'react';
import { EnhancedEditablePreview } from './EnhancedEditablePreview';
import { PromptMetadata } from '@/types/prompts/metadata';

interface TemplatePreviewProps {
  metadata: PromptMetadata;
  content: string;
  blockContentCache?: Record<number, string>;
  isDarkMode: boolean;
  finalPromptContent: string;
  onFinalContentChange: (content: string) => void;
  className?: string;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  metadata,
  content,
  blockContentCache,
  isDarkMode,
  finalPromptContent,
  onFinalContentChange,
  className
}) => (
  <EnhancedEditablePreview
    metadata={metadata}
    content={content}
    blockContentCache={blockContentCache}
    isDarkMode={isDarkMode}
    finalPromptContent={finalPromptContent}
    onFinalContentChange={onFinalContentChange}
    title="Template Preview"
    collapsible={false}
    className={className}
  />
);

export default TemplatePreview;
