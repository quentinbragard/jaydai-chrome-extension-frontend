import React from 'react';
import { EnhancedEditablePreview } from './EnhancedEditablePreview';
import { PromptMetadata } from '@/types/prompts/metadata';

interface TemplatePreviewProps {
  metadata: PromptMetadata;
  blockContentCache?: Record<number, string>;
  isDarkMode: boolean;
  finalPromptContent: string;
  onFinalContentChange?: (content: string) => void;
  className?: string;
  editable?: boolean;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  metadata,
  blockContentCache,
  isDarkMode,
  finalPromptContent,
  onFinalContentChange,
  className,
  editable = false
}) => (
  <EnhancedEditablePreview
    metadata={metadata}
    blockContentCache={blockContentCache}
    isDarkMode={isDarkMode}
    finalPromptContent={finalPromptContent}
    onFinalContentChange={onFinalContentChange}
    editable={editable}
    title="Template Preview"
    collapsible={false}
    className={className}
  />
);

export default TemplatePreview;
