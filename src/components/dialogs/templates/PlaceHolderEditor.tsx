// src/components/dialogs/templates/PlaceholderEditor.tsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { AddBlockButton } from '@/components/common/AddBlockButton';
import { Block } from '@/types/prompts/blocks';
import { useDialog } from '@/hooks/dialogs/useDialog';
import { BaseDialog } from '../BaseDialog';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS, incrementUserProperty } from '@/utils/amplitude';

// Custom hook to detect dark mode
const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const updateDarkModeState = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateDarkModeState();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    updateDarkModeState();
    
    return () => observer.disconnect();
  }, []);

  return isDarkMode;
};

interface Placeholder {
  key: string;
  value: string;
}

const SAMPLE_BLOCKS: Block[] = [
  { id: 1, name: 'Context Block', type: 'context', content: '[Context]' },
  { id: 2, name: 'Role Block', type: 'role', content: '[Role]' }
];

/**
 * Dialog for editing template placeholders
 */
export const PlaceholderEditor: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog('placeholderEditor');
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [modifiedContent, setModifiedContent] = useState('');
  const [contentMounted, setContentMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const isDarkMode = useDarkMode();

  const handleAddBlock = (block: Block, position: 'start' | 'end') => {
    const newContent = position === 'start'
      ? `${block.content}\n${modifiedContent}`
      : `${modifiedContent}\n${block.content}`;
    setModifiedContent(newContent);

    if (editorRef.current) {
      editorRef.current.innerHTML = highlightPlaceholders(newContent);
    }
  };

  // Safe extraction of dialog data with defaults
  console.log('data 😘😘😘', data);
  const templateContent = data?.content || '';
  const templateTitle = data?.title || 'Template';
  const onComplete = data?.onComplete || (() => {});
  
  /**
   * Extract placeholders from template content
   */
  const extractPlaceholders = (content: string) => {
    const placeholderRegex = /\[(.*?)\]/g;
    const matches = [...content.matchAll(placeholderRegex)];

    const uniqueKeys = new Set();
    const uniquePlaceholders = [];

    for (const match of matches) {
      const placeholder = match[0];

      if (uniqueKeys.has(placeholder)) continue;
      uniqueKeys.add(placeholder);

      const existingPlaceholder = placeholders.find((p) => p.key === placeholder);

      uniquePlaceholders.push({
        key: placeholder,
        value: existingPlaceholder ? existingPlaceholder.value : "",
      });
    }

    return uniquePlaceholders;
  };

  /**
   * Function to highlight placeholders inside the content with improved formatting
   */
  const highlightPlaceholders = (content: string) => {
    // First, normalize the content to ensure consistent line breaks
    const normalizedContent = content.replace(/\r\n/g, '\n');
    
    // Escape HTML entities to prevent XSS and preserve content
    const escapedContent = normalizedContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    // Then handle newlines by converting them to <br> tags
    const withLineBreaks = escapedContent.replace(/\n/g, '<br>');
    
    // Finally, highlight placeholders
    return withLineBreaks.replace(
      /\[(.*?)\]/g, 
      `<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>`
    );
  };

  // Initialize content and placeholders when dialog opens or content changes
  useEffect(() => {
    if (isOpen && templateContent) {
      setError(null);
      
      // Normalize template content to ensure consistent line breaks
      const normalizedContent = templateContent.replace(/\r\n/g, '\n');
      setModifiedContent(normalizedContent);
      
      try {
        const extractedPlaceholders = extractPlaceholders(normalizedContent);
        setPlaceholders(extractedPlaceholders);
        
        // Use a short timeout to ensure the ref is available
        setTimeout(() => {
          if (editorRef.current) {
            // Apply the highlighting with proper newline handling
            editorRef.current.innerHTML = highlightPlaceholders(normalizedContent);
            setContentMounted(true);
          }
        }, 10);
      } catch (err) {
        console.error("Error processing template:", err);
        setError("Failed to process template. Please try again.");
      }
    } else {
      // Reset states when dialog closes
      setContentMounted(false);
    }
  }, [isOpen, templateContent]);

  // Setup the mutation observer only once after mounting
  useEffect(() => {
    if (!contentMounted || !editorRef.current) return;

    // Create a new observer
    observerRef.current = new MutationObserver(() => {
      // Skip processing while user is actively editing
      if (isEditing || !editorRef.current) return;
      
      // Get the HTML content
      const htmlContent = editorRef.current.innerHTML;
      
      // First, normalize <br> tags to ensure consistent processing
      const normalizedHtml = htmlContent
        .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>')  // Replace double <br>s
        .replace(/<div><br><\/div>/gi, '<br>')         // Replace div-wrapped <br>s
        .replace(/<p><br><\/p>/gi, '<br>');            // Replace p-wrapped <br>s
      
      // Process the normalized content:
      const textContent = normalizedHtml
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div\s*\/?>/gi, '')
        .replace(/<\/div>/gi, '')
        .replace(/<p\s*\/?>/gi, '')
        .replace(/<\/p>/gi, '')
        .replace(/<\/?span[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&');
      
      setModifiedContent(textContent);
    });

    // Start observing
    observerRef.current.observe(editorRef.current, { 
      childList: true, 
      subtree: true, 
      characterData: true,
      attributes: false 
    });

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [contentMounted]);

  // Handle editor focus events
  const handleEditorFocus = () => {
    setIsEditing(true);
    // Temporarily disconnect the observer when editing starts
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  };

  // Handle editor blur events
  const handleEditorBlur = () => {
    setIsEditing(false);
    // Extract content and update state
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;
      // Process HTML content to text (similar to the observer logic)
      const textContent = htmlContent
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div\s*\/?>/gi, '')
        .replace(/<\/div>/gi, '\n')
        .replace(/<p\s*\/?>/gi, '')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/?span[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&');
      
      setModifiedContent(textContent);
      
      // Reconnect the observer
      if (observerRef.current && editorRef.current) {
        observerRef.current.observe(editorRef.current, { 
          childList: true, 
          subtree: true, 
          characterData: true,
          attributes: false 
        });
      }
    }
  };

  /**
   * Helper function to escape regex characters
   */
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  /**
   * Update placeholder values and reflect changes in the editor
   */
  const updatePlaceholder = (index: number, value: string) => {
    // Skip if user is actively editing
    if (isEditing) return;
    
    const updatedPlaceholders = [...placeholders];
    updatedPlaceholders[index].value = value;
    setPlaceholders(updatedPlaceholders);

    // Start with the original template content
    let newContent = templateContent.replace(/\r\n/g, '\n');
    
    // Replace placeholders with their values
    updatedPlaceholders.forEach(({ key, value }) => {
      if (value) {
        const regex = new RegExp(escapeRegExp(key), "g");
        newContent = newContent.replace(regex, value);
      }
    });

    // Update state with the new content
    setModifiedContent(newContent);

    // Update the editor display with proper highlighting
    if (editorRef.current && !isEditing) {
      // Temporarily disconnect observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      // Make sure the HTML we set doesn't have doubled line breaks
      editorRef.current.innerHTML = highlightPlaceholders(newContent);
      
      // Reconnect observer
      if (observerRef.current && editorRef.current) {
        observerRef.current.observe(editorRef.current, { 
          childList: true, 
          subtree: true, 
          characterData: true,
          attributes: false 
        });
      }
    }
  };

  /**
  * Handle template completion
  */
  const handleComplete = (data: any) => {
    // Call the callback with the modified content
    onComplete(modifiedContent);
    // Close the dialog
    dialogProps.onOpenChange(false);
    
    // Dispatch events to notify that the editor is closed and to close all panels
    trackEvent(EVENTS.TEMPLATE_USED, {
      template_id: data.id,
      template_name: data.title,
      template_type: data.type
    });
    document.dispatchEvent(new CustomEvent('jaydai:placeholder-editor-closed'));
    document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
  };

  /**
  * Handle dialog close
  */
  const handleClose = () => {
    // Close dialog
    dialogProps.onOpenChange(false);
    
    // Also dispatch close events
    document.dispatchEvent(new CustomEvent('jaydai:placeholder-editor-closed'));
    document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
  };

  if (!isOpen) return null;

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          handleClose();
        }
        dialogProps.onOpenChange(open);
      }}
      title={getMessage('placeholderEditor', undefined, 'Placeholder Editor')}
      description={getMessage('placeholderEditorDescription', undefined, 'Edit placeholders in your template')}
      className="jd-max-w-4xl"
    >
      <div className="jd-flex jd-flex-col jd-space-y-4 jd-mt-4">
        {error && (
          <Alert variant="destructive" className="jd-mb-4">
            <AlertTriangle className="jd-h-4 jd-w-4 jd-mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-6 jd-my-4 jd-flex-grow jd-overflow-hidden jd-w-full">
          {/* Placeholders Section */}
          <div className="jd-space-y-4 jd-overflow-auto">
            <h3 className="jd-text-sm jd-font-medium jd-mb-2">{getMessage('replacePlaceholders')}</h3>

            {placeholders.length > 0 ? (
              <ScrollArea className="jd-h-[50vh]">
                <div className="jd-space-y-4 jd-pr-4">
                  {placeholders.map((placeholder, idx) => (
                    <div key={placeholder.key + idx} className="jd-space-y-1">
                      <label className="jd-text-sm jd-font-medium jd-flex jd-items-center">
                        <span className="jd-bg-primary/10 jd-px-2 jd-py-1 jd-rounded">{placeholder.key}</span>
                      </label>
                      <Input
                        value={placeholder.value}
                        onChange={(e) => updatePlaceholder(idx, e.target.value)}
                        placeholder={getMessage('enterValueFor', [placeholder.key])}
                        className="jd-w-full"
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="jd-text-muted-foreground jd-text-center jd-py-8">{getMessage('noPlaceholders')}</div>
            )}
          </div>

          {/* Rich Text Editable Section */}
          <div
            className={`jd-border jd-rounded-md jd-p-4 jd-overflow-hidden jd-flex jd-flex-col ${
              isDarkMode ? "jd-border-gray-700" : "jd-border-gray-200"
            }`}
          >
            <h3 className="jd-text-sm jd-font-medium jd-mb-2">{getMessage('editTemplate')}</h3>
            <div className="jd-relative jd-flex jd-flex-col jd-flex-grow">
              <AddBlockButton
                blocks={SAMPLE_BLOCKS}
                onAdd={(b) => handleAddBlock(b, 'start')}
                className="jd-absolute jd-left-1/2 -jd-translate-x-1/2 -jd-top-3"
              />
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={handleEditorFocus}
                onBlur={handleEditorBlur}
                className={`jd-flex-grow jd-h-[50vh] jd-resize-none jd-border jd-rounded-md jd-p-4 jd-focus-visible:jd-outline-none jd-focus-visible:jd-ring-2 jd-focus-visible:jd-ring-primary jd-overflow-auto jd-whitespace-pre-wrap ${
                  isDarkMode
                    ? "jd-bg-gray-800 jd-text-gray-100 jd-border-gray-700"
                    : "jd-bg-white jd-text-gray-900 jd-border-gray-200"
                }`}
              ></div>
              <AddBlockButton
                blocks={SAMPLE_BLOCKS}
                onAdd={(b) => handleAddBlock(b, 'end')}
                className="jd-absolute jd-left-1/2 -jd-translate-x-1/2 jd-bottom-3"
              />
            </div>
          </div>
        </div>

        <div className="jd-mt-4 jd-flex jd-justify-end jd-gap-2">
          <Button variant="outline" onClick={handleClose}>
            {getMessage('cancel')}
          </Button>
          <Button onClick={() => handleComplete(data)}>{getMessage('useTemplate')}</Button>
        </div>
      </div>
    </BaseDialog>
  );
};