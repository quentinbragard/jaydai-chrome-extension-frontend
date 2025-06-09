import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/core/utils/classNames';

interface EditablePromptPreviewProps {
  content: string;
  htmlContent?: string;
  onChange?: (content: string) => void;
  isDark: boolean;
}

/**
 * Reusable preview component with placeholder highlighting and optional editing.
 * Extracted from InsertBlockDialog so it can be reused across editors.
 */
export const EditablePromptPreview: React.FC<EditablePromptPreviewProps> = ({
  content,
  htmlContent,
  onChange,
  isDark
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const highlightPlaceholders = (text: string) => {
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
  };

  // Update display when not editing
  useEffect(() => {
    if (editorRef.current && !isEditing) {
      if (htmlContent && htmlContent.trim()) {
        const colored = htmlContent.replace(/\[(.*?)\]/g,
          '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
        );
        editorRef.current.innerHTML = colored;
      } else {
        editorRef.current.innerHTML = highlightPlaceholders(content);
      }
    }
  }, [content, htmlContent, isEditing]);

  // Set up editing mode when it changes
  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.textContent = content;
      editorRef.current.focus();
      setTimeout(() => {
        if (editorRef.current) {
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
    }
  }, [isEditing, content]);

  const startEditing = (e: React.MouseEvent) => {
    if (!onChange) return;
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const stopEditing = () => {
    if (isEditing && editorRef.current) {
      const newContent = editorRef.current.textContent || '';
      onChange?.(newContent);
      setIsEditing(false);
    }
  };

  const handleInput = () => {
    if (isEditing && editorRef.current) {
      const newContent = editorRef.current.textContent || '';
      onChange?.(newContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (isEditing && e.key === 'Escape') {
      e.preventDefault();
      stopEditing();
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    const related = e.relatedTarget as HTMLElement;
    if (!editorRef.current?.contains(related)) {
      stopEditing();
    }
  };

  return (
    <div
      ref={editorRef}
      contentEditable={isEditing}
      onClick={!isEditing ? startEditing : undefined}
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onKeyPress={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      className={cn(
        'jd-min-h-[200px] jd-p-4 jd-rounded-lg jd-border jd-text-sm jd-leading-relaxed',
        'jd-whitespace-pre-wrap jd-break-words jd-transition-all jd-duration-200',
        'focus:jd-outline-none',
        onChange ? (isEditing ? 'jd-ring-2 jd-ring-primary/50 jd-cursor-text jd-bg-opacity-95' : 'jd-cursor-pointer hover:jd-bg-muted/10 hover:jd-border-primary/30') : 'jd-cursor-default',
        isDark ? 'jd-bg-gray-800 jd-border-gray-700 jd-text-white' : 'jd-bg-white jd-border-gray-200 jd-text-gray-900'
      )}
      style={{
        minHeight: '200px',
        wordBreak: 'break-word',
        ...(isEditing && {
          color: isDark ? '#ffffff' : '#000000',
          backgroundColor: isDark ? '#1f2937' : '#ffffff'
        })
      }}
      suppressContentEditableWarning={true}
      title={onChange ? (isEditing ? 'Press Escape to finish editing' : 'Click to edit your prompt') : undefined}
      spellCheck={false}
    />
  );
};

export default EditablePromptPreview;
