// src/components/prompts/EnhancedEditablePreview.tsx - Fixed Version
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import EditablePromptPreview from './EditablePromptPreview';
import { PromptMetadata } from '@/types/prompts/metadata';

interface EnhancedEditablePreviewProps {
  metadata: PromptMetadata;
  blockContentCache?: Record<number, string>;
  isDarkMode: boolean;
  finalPromptContent: string;
  onFinalContentChange?: (content: string) => void;
  className?: string;
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  editable?: boolean;
}

export const EnhancedEditablePreview: React.FC<EnhancedEditablePreviewProps> = ({
  metadata,
  blockContentCache,
  isDarkMode,
  finalPromptContent,
  onFinalContentChange,
  className = '',
  title = 'Complete Preview',
  collapsible = false,
  defaultCollapsed = false,
  editable = true
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const previewHtml = useMemo(() => {
    if (!finalPromptContent?.trim()) {
      return '<span class="jd-text-muted-foreground jd-italic">Your prompt will appear here...</span>';
    }

    // Simple HTML conversion with placeholder highlighting
    let html = finalPromptContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');

    // Highlight placeholders
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
      {/* Header */}
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
          {/* Collapse toggle */}
          {collapsible && (
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleCollapsed}
              className="jd-h-7 jd-w-7 jd-p-0"
              title={isCollapsed ? "Show preview" : "Hide preview"}
            >
              {isCollapsed ? <Eye className="jd-h-3 jd-w-3" /> : <EyeOff className="jd-h-3 jd-w-3" />}
            </Button>
          )}
        </div>
      </div>

      {/* Instructions */}
      {!isCollapsed && (
        <div className="jd-text-xs jd-text-muted-foreground jd-flex jd-items-center jd-gap-4">
          <span>{editable ? 'Click to edit your complete prompt preview' : 'Preview of your complete prompt'}</span>
          <div className="jd-flex jd-items-center jd-gap-1">
            <span className="jd-inline-block jd-w-3 jd-h-3 jd-bg-yellow-300 jd-rounded"></span>
            <span>Placeholders</span>
          </div>
        </div>
      )}

      {/* Preview */}
      {!isCollapsed && (
        <div className={cn(
          'jd-border jd-rounded-lg jd-p-1',
          'jd-bg-gradient-to-r jd-from-green-500/10 jd-to-teal-500/10 jd-border-green-200 jd-dark:jd-border-green-700'
        )}>
          <EditablePromptPreview
            content={finalPromptContent}
            htmlContent={previewHtml}
            onChange={editable ? onFinalContentChange : undefined}
            isDark={isDarkMode}
            showColors={true}
            enableAdvancedEditing={editable}
          />
        </div>
      )}

      {/* Debug info in development */}
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
