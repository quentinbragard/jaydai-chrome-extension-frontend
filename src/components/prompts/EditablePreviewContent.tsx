// src/components/prompts/EditablePreviewContent.tsx - base editable preview component
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/core/utils/classNames';
import { buildEnhancedPreview } from '@/utils/templates/placeholderHelpers';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Edit3, Check, X, Maximize2, Minimize2 } from 'lucide-react';
import type { BlockRangeMap } from '@/types/prompts/metadata';

interface EditablePreviewContentProps {
  content: string;
  htmlContent?: string;
  onChange?: (content: string) => void;
  isDark: boolean;
  blockRanges?: BlockRangeMap;
  showColors?: boolean;
  enableAdvancedEditing?: boolean;
}

/**
 * Enhanced preview component with dynamic height and better editing experience.
 */
export const EditablePreviewContent: React.FC<EditablePreviewContentProps> = ({
  content,
  htmlContent,
  onChange,
  isDark,
  blockRanges,
  showColors = true,
  enableAdvancedEditing = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState(content);
  const [isFullHeight, setIsFullHeight] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Enhanced HTML content with colors if not provided
  const enhancedHtmlContent = htmlContent || (showColors ? buildEnhancedPreview(content, isDark) : null);

  // Update editing content when content prop changes (but not when user is editing)
  useEffect(() => {
    if (!isEditing) {
      setEditingContent(content);
    }
  }, [content, isEditing]);

  // Calculate dynamic height based on content
  const calculateTextareaHeight = useCallback((text: string) => {
    const lines = text.split('\n').length;
    const avgLineHeight = 24; // pixels per line
    const padding = 32; // top and bottom padding
    const minHeight = 250; // minimum height in pixels
    const maxHeight = isFullHeight ? window.innerHeight * 0.9 : 600; // max height
    
    const calculatedHeight = Math.max(
      minHeight,
      Math.min(maxHeight, (lines * avgLineHeight) + padding)
    );
    
    return `${calculatedHeight}px`;
  }, [isFullHeight]);

  // Auto-resize textarea when content changes
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      const height = calculateTextareaHeight(editingContent);
      textareaRef.current.style.height = height;
    }
  }, [editingContent, isEditing, calculateTextareaHeight]);

  const highlightPlaceholders = useCallback((text: string) => {
    if (!text) {
      return '<span class="jd-text-muted-foreground jd-italic">Your prompt will appear here...</span>';
    }
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\[(.*?)\]/g,
        '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
      );
  }, []);

  // Update display when not editing
  useEffect(() => {
    if (displayRef.current && !isEditing) {
      if (enhancedHtmlContent && enhancedHtmlContent.trim()) {
        const finalHtml = enhancedHtmlContent.includes('jd-bg-yellow-300') 
          ? enhancedHtmlContent 
          : enhancedHtmlContent.replace(/\[(.*?)\]/g,
              '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
            );
        displayRef.current.innerHTML = finalHtml;
      } else {
        displayRef.current.innerHTML = highlightPlaceholders(content);
      }
    }
  }, [content, enhancedHtmlContent, isEditing, highlightPlaceholders]);

  const startEditing = useCallback((e?: React.MouseEvent) => {
    if (!onChange) return;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsEditing(true);
    setEditingContent(content);
    
    // Focus textarea after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        
        // Set initial height
        const height = calculateTextareaHeight(content);
        textareaRef.current.style.height = height;
        
        // If we clicked on a specific position, try to estimate cursor position
        if (e && displayRef.current) {
          const rect = displayRef.current.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const lineHeight = 24;
          const lineNumber = Math.floor(y / lineHeight);
          const lines = content.split('\n');
          
          let position = 0;
          for (let i = 0; i < Math.min(lineNumber, lines.length); i++) {
            position += lines[i].length + 1;
          }
          
          textareaRef.current.setSelectionRange(position, position);
        }
      }
    }, 50);
  }, [onChange, content, calculateTextareaHeight]);

  const stopEditing = useCallback((save: boolean = true) => {
    if (save && onChange) {
      onChange(editingContent);
    } else {
      setEditingContent(content);
    }
    setIsEditing(false);
    setIsFullHeight(false); // Reset full height when stopping edit
  }, [onChange, editingContent, content]);

  const toggleFullHeight = useCallback(() => {
    setIsFullHeight(prev => !prev);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      stopEditing(false);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      stopEditing(true);
    }
  }, [stopEditing]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditingContent(newValue);
    
    // Auto-resize textarea
    const height = calculateTextareaHeight(newValue);
    e.target.style.height = height;
  }, [calculateTextareaHeight]);

  // Enhanced editing mode
  if (enableAdvancedEditing && isEditing) {
    return (
      <div className="jd-relative jd-group">
        {/* Edit mode header */}
        <div className="jd-flex jd-items-center jd-justify-between jd-mb-2 jd-p-2 jd-bg-primary/10 jd-rounded-t-lg jd-border-b">
          <div className="jd-flex jd-items-center jd-gap-2">
            <Edit3 className="jd-h-4 jd-w-4 jd-text-primary" />
            <span className="jd-text-sm jd-font-medium">Editing Preview</span>
          </div>
          <div className="jd-flex jd-items-center jd-gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullHeight}
              className="jd-h-7 jd-px-2 jd-text-muted-foreground hover:jd-bg-muted"
              title={isFullHeight ? "Minimize editor" : "Maximize editor"}
            >
              {isFullHeight ? <Minimize2 className="jd-h-3 jd-w-3" /> : <Maximize2 className="jd-h-3 jd-w-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => stopEditing(true)}
              className="jd-h-7 jd-px-2 jd-text-green-600 hover:jd-bg-green-50"
            >
              <Check className="jd-h-3 jd-w-3 jd-mr-1" />
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => stopEditing(false)}
              className="jd-h-7 jd-px-2 jd-text-red-600 hover:jd-bg-red-50"
            >
              <X className="jd-h-3 jd-w-3 jd-mr-1" />
              Cancel
            </Button>
          </div>
        </div>

        {/* Enhanced textarea with dynamic height */}
        <Textarea
          ref={textareaRef}
          value={editingContent}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onKeyPress={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          className={cn(
            'jd-text-sm jd-resize-none jd-transition-all jd-duration-200',
            'focus:jd-ring-2 focus:jd-ring-primary/50 jd-rounded-t-none',
            'jd-overflow-y-auto', // Enable scrolling when content exceeds height
            isDark 
              ? 'jd-bg-gray-800 jd-border-gray-700 jd-text-white' 
              : 'jd-bg-white jd-border-gray-200 jd-text-gray-900'
          )}
          placeholder="Enter your prompt content here..."
          spellCheck={false}
          style={{
            height: calculateTextareaHeight(editingContent),
            minHeight: '250px',
            maxHeight: isFullHeight ? `${window.innerHeight * 0.7}px` : '400px'
          }}
        />

        {/* Edit mode footer with tips */}
        <div className="jd-flex jd-justify-between jd-items-center jd-mt-2 jd-text-xs jd-text-muted-foreground jd-px-1">
          <span>{editingContent.length} characters</span>
          <div className="jd-flex jd-items-center jd-gap-3">
            <span>{editingContent.split('\n').length} lines</span>
            <span className="jd-text-primary">Ctrl+Enter to save • Esc to cancel</span>
          </div>
        </div>
      </div>
    );
  }

  // Standard editing mode with improved height
  if (isEditing && !enableAdvancedEditing) {
    return (
      <div className="jd-relative">
        {/* Header for standard mode */}
        <div className="jd-flex jd-items-center jd-justify-end jd-mb-2 jd-gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullHeight}
            className="jd-h-7 jd-px-2 jd-text-muted-foreground hover:jd-bg-muted"
            title={isFullHeight ? "Minimize editor" : "Maximize editor"}
          >
            {isFullHeight ? <Minimize2 className="jd-h-3 jd-w-3" /> : <Maximize2 className="jd-h-3 jd-w-3" />}
          </Button>
        </div>
        
        <Textarea
          ref={textareaRef}
          value={editingContent}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onBlur={() => stopEditing(true)}
          onKeyPress={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          className={cn(
            'jd-text-sm jd-resize-none jd-transition-all jd-duration-200',
            'focus:jd-ring-2 focus:jd-ring-primary/50',
            'jd-overflow-y-auto',
            isDark 
              ? 'jd-bg-gray-800 jd-border-gray-700 jd-text-white' 
              : 'jd-bg-white jd-border-gray-200 jd-text-gray-900'
          )}
          autoFocus
          spellCheck={false}
          style={{
            height: calculateTextareaHeight(editingContent),
            minHeight: '250px',
            maxHeight: isFullHeight ? `${window.innerHeight * 0.7}px` : '400px'
          }}
        />
        
        {/* Footer for standard mode */}
        <div className="jd-flex jd-justify-between jd-items-center jd-mt-1 jd-text-xs jd-text-muted-foreground">
          <span>{editingContent.length} characters • {editingContent.split('\n').length} lines</span>
          <span className="jd-text-primary">Esc to cancel</span>
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div className="jd-relative jd-group">
      {/* Edit indicator for editable previews */}
      {onChange && (
        <div className="jd-absolute jd-top-2 jd-right-2 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity jd-z-10">
          <Button
            size="sm"
            variant="secondary"
            onClick={startEditing}
            className="jd-h-7 jd-px-2 jd-text-xs jd-shadow-lg"
          >
            <Edit3 className="jd-h-3 jd-w-3 jd-mr-1" />
            Edit
          </Button>
        </div>
      )}
      
      <div
        ref={displayRef}
        onClick={onChange ? startEditing : undefined}
        className={cn(
          'jd-min-h-[200px] jd-p-4 jd-rounded-lg jd-border jd-text-sm jd-leading-relaxed',
          'jd-whitespace-pre-wrap jd-break-words jd-transition-all jd-duration-200',
          'jd-overflow-y-auto jd-max-h-[400px]',
          onChange ? (
            'jd-cursor-pointer hover:jd-bg-muted/10 hover:jd-border-primary/30 hover:jd-shadow-sm'
          ) : 'jd-cursor-default',
          isDark 
            ? 'jd-bg-gray-800 jd-border-gray-700 jd-text-white' 
            : 'jd-bg-white jd-border-gray-200 jd-text-gray-900',
          showColors && 'jd-prose jd-prose-sm jd-max-w-none'
        )}
        style={{
          minHeight: '200px',
          wordBreak: 'break-word'
        }}
        title={onChange ? 'Click to edit your prompt' : undefined}
      />
      
      {/* Enhanced bottom info bar */}
      {content && (
        <div className="jd-flex jd-justify-between jd-items-center jd-mt-2 jd-text-xs jd-text-muted-foreground jd-px-1">
          <span>{content.length} characters</span>
          <div className="jd-flex jd-items-center jd-gap-3">
            <span>{content.split('\n').length} lines</span>
            {showColors && (
              <div className="jd-flex jd-items-center jd-gap-1">
                <div className="jd-w-2 jd-h-2 jd-bg-purple-500 jd-rounded-full"></div>
                <div className="jd-w-2 jd-h-2 jd-bg-green-500 jd-rounded-full"></div>
                <div className="jd-w-2 jd-h-2 jd-bg-blue-500 jd-rounded-full"></div>
                <span className="jd-text-[10px]">colored</span>
              </div>
            )}
            {onChange && (
              <span className="jd-text-primary jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity">
                Click to edit
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditablePreviewContent;
