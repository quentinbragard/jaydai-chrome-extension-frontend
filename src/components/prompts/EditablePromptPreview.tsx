import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import EditablePreviewContent from './EditablePreviewContent';
import { PromptMetadata } from '@/types/prompts/metadata';

interface EditablePromptPreviewProps {
  metadata: PromptMetadata;
  blockContentCache?: Record<number, string>;
  isDarkMode: boolean;
  finalPromptContent: string;
  onFinalContentChange: (content: string) => void;
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
  className = '',
  title = 'Complete Preview',
  collapsible = false,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const previewHtml = useMemo(() => {
    if (!finalPromptContent?.trim()) {
      return '<span class="jd-text-muted-foreground jd-italic">Your prompt will appear here...</span>';
    }

    let html = finalPromptContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');

    html = html.replace(/\[([^\]]+)\]/g,
      '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
    );

    return html;
  }, [finalPromptContent]);

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
        <div className="jd-text-xs jd-text-muted-foreground jd-flex jd-items-center jd-gap-4">
          <span>Click to edit your complete prompt preview</span>
          <div className="jd-flex jd-items-center jd-gap-1">
            <span className="jd-inline-block jd-w-3 jd-h-3 jd-bg-yellow-300 jd-rounded"></span>
            <span>Placeholders</span>
          </div>
        </div>
      )}

      {!isCollapsed && (
        <div className={cn(
          'jd-border jd-rounded-lg jd-p-1',
          'jd-bg-gradient-to-r jd-from-green-500/10 jd-to-teal-500/10 jd-border-green-200 jd-dark:jd-border-green-700'
        )}>
          <EditablePreviewContent
            content={finalPromptContent}
            htmlContent={previewHtml}
            onChange={onFinalContentChange}
            isDark={isDarkMode}
            showColors={true}
            enableAdvancedEditing={true}
          />
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
