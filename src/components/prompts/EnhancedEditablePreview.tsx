// src/components/prompts/EnhancedEditablePreview.tsx - Fixed Version
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, RotateCcw, Check, X, Eye, EyeOff, Save } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import EditablePromptPreview from './EditablePromptPreview';
import { PromptMetadata } from '@/types/prompts/metadata';

interface EnhancedEditablePreviewProps {
  metadata: PromptMetadata;
  content: string;
  blockContentCache?: Record<number, string>;
  isDarkMode: boolean;
  
  // Centralized final content management
  finalPromptContent: string;
  onFinalContentChange: (content: string) => void;
  
  // DEPRECATED: These are now handled centrally
  onContentChange?: (content: string) => void;
  onMetadataChange?: (metadata: PromptMetadata) => void;
  
  className?: string;
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const EnhancedEditablePreview: React.FC<EnhancedEditablePreviewProps> = ({
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
  const [localContent, setLocalContent] = useState(finalPromptContent);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  
  // **FIX: Prevent multiple applications with refs**
  const isApplyingRef = useRef(false);
  const autoApplyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastExternalContentRef = useRef(finalPromptContent);
  
  // **FIX: Sync with external final content changes (but prevent feedback loops)**
  useEffect(() => {
    console.log('EnhancedEditablePreview: External content changed', {
      new: finalPromptContent.substring(0, 50) + '...',
      old: lastExternalContentRef.current.substring(0, 50) + '...',
      isApplying: isApplyingRef.current
    });
    
    // **FIX: Only sync if we're not in the middle of applying changes**
    if (!isApplyingRef.current && finalPromptContent !== lastExternalContentRef.current) {
      console.log('EnhancedEditablePreview: Syncing with external content');
      setLocalContent(finalPromptContent);
      setHasLocalChanges(false);
      lastExternalContentRef.current = finalPromptContent;
      
      // Clear any pending auto-apply
      if (autoApplyTimeoutRef.current) {
        clearTimeout(autoApplyTimeoutRef.current);
        autoApplyTimeoutRef.current = null;
      }
    }
  }, [finalPromptContent]);

  // **FIX: Generate HTML preview from local content**
  const previewHtml = React.useMemo(() => {
    if (!localContent?.trim()) {
      return '<span class="jd-text-muted-foreground jd-italic">Your prompt will appear here...</span>';
    }

    // Simple HTML conversion with placeholder highlighting
    let html = localContent
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
  }, [localContent]);

  // **FIX: Handle local content changes (with debouncing)**
  const handleLocalContentChange = useCallback((newContent: string) => {
    console.log('EnhancedEditablePreview: Local content changed', {
      new: newContent.substring(0, 50) + '...',
      hasChanges: newContent !== finalPromptContent
    });
    
    setLocalContent(newContent);
    setHasLocalChanges(newContent !== finalPromptContent);
    
    // **FIX: Clear previous timeout**
    if (autoApplyTimeoutRef.current) {
      clearTimeout(autoApplyTimeoutRef.current);
    }
    
    // **FIX: Only auto-apply if content actually changed and we're not already applying**
    if (newContent !== finalPromptContent && !isApplyingRef.current) {
      autoApplyTimeoutRef.current = setTimeout(() => {
        console.log('EnhancedEditablePreview: Auto-applying changes');
        applyLocalChanges();
      }, 2000);
    }
  }, [finalPromptContent]);

  // **FIX: Apply local changes to parent (with feedback loop prevention)**
  const applyLocalChanges = useCallback(() => {
    if (isApplyingRef.current) {
      console.log('EnhancedEditablePreview: Already applying, skipping');
      return;
    }
    
    console.log('EnhancedEditablePreview: Applying local changes');
    isApplyingRef.current = true;
    
    try {
      onFinalContentChange(localContent);
      lastExternalContentRef.current = localContent;
      setHasLocalChanges(false);
      
      // Clear timeout
      if (autoApplyTimeoutRef.current) {
        clearTimeout(autoApplyTimeoutRef.current);
        autoApplyTimeoutRef.current = null;
      }
    } finally {
      // **FIX: Reset applying flag after a short delay**
      setTimeout(() => {
        isApplyingRef.current = false;
        console.log('EnhancedEditablePreview: Apply complete');
      }, 100);
    }
  }, [localContent, onFinalContentChange]);

  // **FIX: Discard local changes**
  const discardLocalChanges = useCallback(() => {
    console.log('EnhancedEditablePreview: Discarding local changes');
    
    // Clear timeout
    if (autoApplyTimeoutRef.current) {
      clearTimeout(autoApplyTimeoutRef.current);
      autoApplyTimeoutRef.current = null;
    }
    
    setLocalContent(finalPromptContent);
    setHasLocalChanges(false);
    lastExternalContentRef.current = finalPromptContent;
  }, [finalPromptContent]);

  // **FIX: Cleanup timeouts on unmount**
  useEffect(() => {
    return () => {
      if (autoApplyTimeoutRef.current) {
        clearTimeout(autoApplyTimeoutRef.current);
      }
    };
  }, []);

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
          
          {hasLocalChanges && (
            <Badge variant="secondary" className="jd-text-xs jd-bg-amber-100 jd-text-amber-800 jd-dark:jd-bg-amber-900/30 jd-dark:jd-text-amber-300">
              Modified locally
            </Badge>
          )}

          {blockContentCache && (
            <Badge variant="outline" className="jd-text-xs">
              Using resolved content
            </Badge>
          )}
        </div>

        <div className="jd-flex jd-items-center jd-gap-2">
          {/* Local change controls */}
          {hasLocalChanges && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={discardLocalChanges}
                className="jd-h-7 jd-px-2 jd-text-xs jd-text-amber-600 hover:jd-text-amber-700"
                title="Discard local changes"
              >
                <RotateCcw className="jd-h-3 jd-w-3 jd-mr-1" />
                Discard
              </Button>
              
              <Button
                size="sm"
                variant="default"
                onClick={applyLocalChanges}
                className="jd-h-7 jd-px-2 jd-text-xs jd-bg-green-600 hover:jd-bg-green-700"
                title="Apply changes immediately"
              >
                <Save className="jd-h-3 jd-w-3 jd-mr-1" />
                Apply
              </Button>
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
          {hasLocalChanges && (
            <span className="jd-text-amber-600 jd-dark:jd-text-amber-400">
              • Changes will auto-apply in 2s
            </span>
          )}
        </div>
      )}

      {/* Preview */}
      {!isCollapsed && (
        <div className={cn(
          'jd-border jd-rounded-lg jd-p-1',
          hasLocalChanges 
            ? 'jd-bg-gradient-to-r jd-from-amber-500/10 jd-to-orange-500/10 jd-border-amber-200 jd-dark:jd-border-amber-700' 
            : 'jd-bg-gradient-to-r jd-from-green-500/10 jd-to-teal-500/10 jd-border-green-200 jd-dark:jd-border-green-700'
        )}>
          <EditablePromptPreview
            content={localContent}
            htmlContent={previewHtml}
            onChange={handleLocalContentChange}
            isDark={isDarkMode}
            showColors={true}
            enableAdvancedEditing={true}
          />
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && !isCollapsed && (
        <details className="jd-text-xs jd-text-muted-foreground">
          <summary className="jd-cursor-pointer">Debug Info</summary>
          <div className="jd-mt-2 jd-space-y-1">
            <div>Final content length: {finalPromptContent.length}</div>
            <div>Local content length: {localContent.length}</div>
            <div>Has local changes: {hasLocalChanges.toString()}</div>
            <div>Content differs: {(localContent !== finalPromptContent).toString()}</div>
            <div>Is applying: {isApplyingRef.current.toString()}</div>
            <div>Auto-apply timeout active: {(autoApplyTimeoutRef.current !== null).toString()}</div>
          </div>
        </details>
      )}
    </div>
  );
};