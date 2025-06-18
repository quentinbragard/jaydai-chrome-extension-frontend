// src/components/prompts/EnhancedEditablePreview.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, RotateCcw, Check, X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import EditablePromptPreview from './EditablePromptPreview';
import { useEditablePromptPreview } from '@/hooks/prompts/editors/useEditablePromptPreview';
import { PromptMetadata } from '@/types/prompts/metadata';

interface EnhancedEditablePreviewProps {
  metadata: PromptMetadata;
  content: string;
  blockContentCache?: Record<number, string>;
  isDarkMode: boolean;
  onContentChange?: (content: string) => void;
  onMetadataChange?: (metadata: PromptMetadata) => void;
  className?: string;
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const EnhancedEditablePreview: React.FC<EnhancedEditablePreviewProps> = ({
  metadata,
  content,
  blockContentCache,
  isDarkMode,
  onContentChange,
  onMetadataChange,
  className = '',
  title = 'Complete Preview',
  collapsible = false,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  const {
    completePreviewText,
    completePreviewHtml,
    handleCompletePreviewChange,
    hasModifications,
    resetOverrides,
    applyOverrides,
    blockContentOverrides,
    effectiveBlockMap
  } = useEditablePromptPreview({
    metadata,
    content,
    blockContentCache,
    isDarkMode,
    onContentChange,
    onMetadataChange
  });

  const handleApplyChanges = () => {
    applyOverrides();
  };

  const handleResetChanges = () => {
    resetOverrides();
  };

  const toggleCollapsed = () => {
    setIsCollapsed(prev => !prev);
  };

  const modificationCount = Object.keys(blockContentOverrides).length + 
    (content !== completePreviewText && onContentChange ? 1 : 0);

  return (
    <div className={cn('jd-space-y-3', className)}>
      {/* Header */}
      <div className="jd-flex jd-items-center jd-justify-between">
        <div className="jd-flex jd-items-center jd-gap-2">
          <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
            <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-green-500 jd-to-teal-600 jd-rounded-full"></span>
            {title}
          </h3>
          
          {hasModifications && (
            <Badge variant="secondary" className="jd-text-xs jd-bg-amber-100 jd-text-amber-800 jd-dark:jd-bg-amber-900/30 jd-dark:jd-text-amber-300">
              {modificationCount} change{modificationCount !== 1 ? 's' : ''}
            </Badge>
          )}

          {blockContentCache && (
            <Badge variant="outline" className="jd-text-xs">
              Using resolved content
            </Badge>
          )}
        </div>

        <div className="jd-flex jd-items-center jd-gap-2">
          {/* Modification controls */}
          {hasModifications && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetChanges}
                className="jd-h-7 jd-px-2 jd-text-xs jd-text-amber-600 hover:jd-text-amber-700"
                title="Reset all changes"
              >
                <RotateCcw className="jd-h-3 jd-w-3 jd-mr-1" />
                Reset
              </Button>
              
              {onContentChange && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleApplyChanges}
                  className="jd-h-7 jd-px-2 jd-text-xs jd-bg-green-600 hover:jd-bg-green-700"
                  title="Apply changes to template"
                >
                  <Check className="jd-h-3 jd-w-3 jd-mr-1" />
                  Apply
                </Button>
              )}
            </>
          )}

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
          <span>Click to edit your complete prompt preview</span>
          <div className="jd-flex jd-items-center jd-gap-1">
            <span className="jd-inline-block jd-w-3 jd-h-3 jd-bg-yellow-300 jd-rounded"></span>
            <span>Placeholders</span>
          </div>
          {hasModifications && (
            <span className="jd-text-amber-600 jd-dark:jd-text-amber-400">
              • Modified content
            </span>
          )}
        </div>
      )}

      {/* Preview */}
      {!isCollapsed && (
        <div className={cn(
          'jd-border jd-rounded-lg jd-p-1',
          hasModifications 
            ? 'jd-bg-gradient-to-r jd-from-amber-500/10 jd-to-orange-500/10 jd-border-amber-200 jd-dark:jd-border-amber-700' 
            : 'jd-bg-gradient-to-r jd-from-green-500/10 jd-to-teal-500/10 jd-border-green-200 jd-dark:jd-border-green-700'
        )}>
          <EditablePromptPreview
            content={completePreviewText}
            htmlContent={completePreviewHtml}
            onChange={handleCompletePreviewChange}
            isDark={isDarkMode}
            showColors={true}
            enableAdvancedEditing={true}
          />
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && !isCollapsed && hasModifications && (
        <details className="jd-text-xs jd-text-muted-foreground">
          <summary className="jd-cursor-pointer">Debug Info</summary>
          <div className="jd-mt-2 jd-space-y-1">
            <div>Original content length: {content.length}</div>
            <div>Preview content length: {completePreviewText.length}</div>
            <div>Block overrides: {Object.keys(blockContentOverrides).length}</div>
            <div>Has modifications: {hasModifications.toString()}</div>
            {Object.keys(blockContentOverrides).length > 0 && (
              <div>
                Modified blocks: {Object.keys(blockContentOverrides).join(', ')}
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
};