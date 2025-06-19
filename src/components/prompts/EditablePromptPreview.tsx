import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import EditablePreviewContent from './EditablePreviewContent';
import { PromptMetadata } from '@/types/prompts/metadata';
import {
  buildMetadataOnlyPreview,
  buildMetadataOnlyPreviewHtml,
  extractContentFromCompleteTemplate,
  resolveMetadataValues
} from '@/utils/templates/promptPreviewUtils';
import { generateUnifiedPreviewHtml } from '@/utils/templates/placeholderHelpers';

interface EditablePromptPreviewProps {
  metadata: PromptMetadata;
  blockContentCache?: Record<number, string>;
  isDarkMode: boolean;
  finalPromptContent: string;
  onFinalContentChange: (content: string) => void;
  /** Base template content */
  promptContent: string;
  /** Called when the template content changes */
  onPromptContentChange: (content: string) => void;
  className?: string;
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const EditablePromptPreview: React.FC<EditablePromptPreviewProps> = ({
  metadata,
  blockContentCache,
  isDarkMode,
  finalPromptContent,
  onFinalContentChange,
  promptContent,
  onPromptContentChange,
  className = '',
  title = 'Complete Preview',
  collapsible = false,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const { metadataHtml, contentHtml } = useMemo(() => {
    const resolved = resolveMetadataValues(metadata, blockContentCache || {});
    const metaText = buildMetadataOnlyPreview(resolved);
    const metaHtml = buildMetadataOnlyPreviewHtml(resolved, isDarkMode);
    const extractedContent = extractContentFromCompleteTemplate(finalPromptContent || '', metaText);
    const html = generateUnifiedPreviewHtml(extractedContent, isDarkMode);
    return { metadataHtml: metaHtml, contentHtml: html };
  }, [metadata, blockContentCache, finalPromptContent, isDarkMode]);

  const toggleCollapsed = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <div className={cn('jd-space-y-3', className)}>
      <div className="jd-flex jd-items-center jd-justify-between">
        <div className="jd-flex jd-items-center jd-gap-2">
          <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
            <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-green-500 jd-to-teal-600 jd-rounded-full"></span>
            {title}
          </h3>

          {blockContentCache && (
            <Badge variant="outline" className="jd-text-xs">
              Using resolved content
            </Badge>
          )}
        </div>

        <div className="jd-flex jd-items-center jd-gap-2">
          {collapsible && (
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleCollapsed}
              className="jd-h-7 jd-w-7 jd-p-0"
              title={isCollapsed ? 'Show preview' : 'Hide preview'}
            >
              {isCollapsed ? <Eye className="jd-h-3 jd-w-3" /> : <EyeOff className="jd-h-3 jd-w-3" />}
            </Button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className={cn(
          'jd-border jd-rounded-lg jd-p-2',
          'jd-bg-gradient-to-r jd-from-green-500/10 jd-to-teal-500/10 jd-border-green-200 jd-dark:jd-border-green-700'
        )}>
          <div className="jd-space-y-3">
            {/* Metadata preview */}
            <div dangerouslySetInnerHTML={{ __html: metadataHtml }} />

            {/* Prompt content area with dashed border */}
            <div className="jd-border-2 jd-border-dashed jd-border-muted jd-rounded-md jd-p-2">
              {(promptContent.trim() || contentHtml.trim()) ? (
                <EditablePreviewContent
                  content={promptContent}
                  htmlContent={contentHtml}
                  onChange={onPromptContentChange}
                  isDark={isDarkMode}
                  showColors={true}
                  enableAdvancedEditing={true}
                />
              ) : (
                <div className="jd-min-h-[80px]" />
              )}
            </div>
          </div>
        </div>
      )}

      {process.env.NODE_ENV === 'development' && !isCollapsed && (
        <details className="jd-text-xs jd-text-muted-foreground">
          <summary className="jd-cursor-pointer">Debug Info</summary>
          <div className="jd-mt-2 jd-space-y-1">
            <div>Final content length: {finalPromptContent.length}</div>
          </div>
        </details>
      )}
    </div>
  );
};

export default EditablePromptPreview;
