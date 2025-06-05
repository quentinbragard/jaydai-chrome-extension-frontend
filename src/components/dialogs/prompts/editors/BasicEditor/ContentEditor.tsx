// src/components/dialogs/prompts/editors/BasicEditor/ContentEditor.tsx
import React from 'react';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';

interface ContentEditorProps {
  mode: 'create' | 'customize';
  onFocus: () => void;
  onBlur: () => void;
  onInput: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onKeyUp: (e: React.KeyboardEvent) => void;
  className?: string;
}

export const ContentEditor = React.forwardRef<HTMLDivElement, ContentEditorProps>(
  ({ mode, onFocus, onBlur, onInput, onKeyDown, onKeyPress, onKeyUp, className }, ref) => {
    const isDarkMode = useThemeDetector();

    return (
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={onFocus}
        onBlur={onBlur}
        onInput={onInput}
        onKeyDown={onKeyDown}
        onKeyPress={onKeyPress}
        onKeyUp={onKeyUp}
        className={cn(
          'jd-resize-none jd-border jd-rounded-md jd-p-4',
          'jd-focus-visible:jd-outline-none jd-focus-visible:jd-ring-2 jd-focus-visible:jd-ring-primary',
          'jd-overflow-auto jd-whitespace-pre-wrap',
          'jd-transition-colors jd-duration-200',
          isDarkMode
            ? "jd-bg-gray-800 jd-text-gray-100 jd-border-gray-700"
            : "jd-bg-white jd-text-gray-900 jd-border-gray-200",
          className
        )}
        spellCheck={false}
        data-mode={mode}
        style={{ 
          minHeight: mode === 'create' ? '300px' : '200px',
          wordBreak: 'break-word'
        }}
      />
    );
  }
);