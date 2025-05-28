// src/components/dialogs/templates/editor/BasicEditor.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Block } from '@/types/prompts/blocks';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useThemeDetector } from '@/hooks/useThemeDetector';

interface BasicEditorProps {
  blocks: Block[];
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  mode?: 'create' | 'customize';
}

interface Placeholder {
  key: string;
  value: string;
}


/**
 * Basic editor mode - Simple placeholder and content editing (like the original)
 * No block logic exposed to the user
 */
export const BasicEditor: React.FC<BasicEditorProps> = ({
  blocks,
  onUpdateBlock,
  mode = 'customize'
}) => {
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [modifiedContent, setModifiedContent] = useState('');
  const [contentMounted, setContentMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const activeInputIndex = useRef<number | null>(null);
  const isDarkMode = useThemeDetector();
  const initialContentRef = useRef('');

  // Get combined content from all blocks
  const getBlockContent = (block: Block): string => {
    if (typeof block.content === 'string') {
      return block.content;
    } else if (block.content && typeof block.content === 'object') {
      const locale = getCurrentLanguage();
      return block.content[locale] || block.content.en || Object.values(block.content)[0] || '';
    }
    return '';
  };

  const templateContent =
    mode === 'customize' && initialContentRef.current
      ? initialContentRef.current
      : blocks.map(block => getBlockContent(block)).join('\n\n');

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
   * Function to highlight placeholders with improved formatting
   */
  const highlightPlaceholders = (content: string) => {
    const normalizedContent = content.replace(/\r\n/g, '\n');
    
    const escapedContent = normalizedContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    const withLineBreaks = escapedContent.replace(/\n/g, '<br>');
    
    return withLineBreaks.replace(
      /\[(.*?)\]/g, 
      `<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>`
    );
  };

  // Initialize content and placeholders
  useEffect(() => {
    if (!templateContent) return;

    if (mode === 'customize' && initialContentRef.current) {
      return;
    }

    const normalizedContent = templateContent.replace(/\r\n/g, '\n');
    setModifiedContent(normalizedContent);

    try {
      const extractedPlaceholders = extractPlaceholders(normalizedContent);
      setPlaceholders(extractedPlaceholders);

      if (!initialContentRef.current) {
        initialContentRef.current = normalizedContent;
      }

      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = highlightPlaceholders(normalizedContent);
          setContentMounted(true);
        }
      }, 10);
    } catch (err) {
      console.error('Error processing template:', err);
    }
  }, [templateContent, mode]);

  // Setup mutation observer
  useEffect(() => {
    if (!contentMounted || !editorRef.current) return;

    observerRef.current = new MutationObserver(() => {
      if (isEditing || !editorRef.current) return;
      
      const htmlContent = editorRef.current.innerHTML;
      
      const normalizedHtml = htmlContent
        .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>')
        .replace(/<div><br><\/div>/gi, '<br>')
        .replace(/<p><br><\/p>/gi, '<br>');
      
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

      if (mode === 'create') {
        const extracted = extractPlaceholders(textContent);
        setPlaceholders(extracted);
      }
      
      // Update the first block with the modified content
      if (blocks.length > 0) {
        onUpdateBlock(blocks[0].id, { content: textContent });
      }
    });

    observerRef.current.observe(editorRef.current, { 
      childList: true, 
      subtree: true, 
      characterData: true,
      attributes: false 
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [contentMounted, blocks, onUpdateBlock]);

  const handleEditorFocus = () => {
    setIsEditing(true);
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  };

  const handleEditorBlur = () => {
    setIsEditing(false);
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;
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

      if (mode === 'create') {
        const extracted = extractPlaceholders(textContent);
        setPlaceholders(extracted);
      }
      
      // Update the first block with the modified content
      if (blocks.length > 0) {
        onUpdateBlock(blocks[0].id, { content: textContent });
      }

      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      editorRef.current.innerHTML = highlightPlaceholders(textContent);

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

  const handleEditorInput = () => {
    if (mode !== 'create' || !editorRef.current) return;

    const htmlContent = editorRef.current.innerHTML;
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

    const extracted = extractPlaceholders(textContent);
    setPlaceholders(extracted);
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "");
  };

  const updatePlaceholder = (index: number, value: string) => {
    if (isEditing) return;

    activeInputIndex.current = index;

    const updatedPlaceholders = [...placeholders];
    updatedPlaceholders[index].value = value;
    setPlaceholders(updatedPlaceholders);

    let newContent =
      (mode === 'customize' ? initialContentRef.current : templateContent).replace(/\r\n/g, '\n');
    
    updatedPlaceholders.forEach(({ key, value }) => {
      if (value) {
        const regex = new RegExp(escapeRegExp(key), "g");
        newContent = newContent.replace(regex, value);
      }
    });

    setModifiedContent(newContent);

    // Update the first block with the modified content
    if (blocks.length > 0) {
      onUpdateBlock(blocks[0].id, { content: newContent });
    }

    if (editorRef.current && !isEditing) {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      editorRef.current.innerHTML = highlightPlaceholders(newContent);
      
      if (observerRef.current && editorRef.current) {
        observerRef.current.observe(editorRef.current, { 
          childList: true, 
          subtree: true, 
          characterData: true,
          attributes: false 
        });
      }
    }

    setTimeout(() => {
      if (activeInputIndex.current !== null) {
        const ref = inputRefs.current[activeInputIndex.current];
        ref?.focus();
      }
    }, 0);
  };

  return (
    <div className="jd-h-full jd-flex jd-flex-1 jd-overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="jd-h-full jd-w-full">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <div className="jd-h-full jd-space-y-4 jd-overflow-auto jd-p-4">
            <h3 className="jd-text-sm jd-font-medium jd-mb-2">Replace Placeholders</h3>
            {placeholders.length > 0 ? (
              <ScrollArea className="jd-h-full">
                <div className="jd-space-y-4 jd-pr-4">
                  {placeholders.map((placeholder, idx) => (
                    <div key={placeholder.key + idx} className="jd-space-y-1">
                      <label className="jd-text-sm jd-font-medium jd-flex jd-items-center">
                        <span className="jd-bg-primary/10 jd-px-2 jd-py-1 jd-rounded">{placeholder.key}</span>
                      </label>
                      {mode === 'customize' ? (
                        <Input
                          ref={el => (inputRefs.current[idx] = el)}
                          onFocus={() => {
                            activeInputIndex.current = idx;
                          }}
                          value={placeholder.value}
                          onChange={(e) => updatePlaceholder(idx, e.target.value)}
                          placeholder={`Enter value for ${placeholder.key}`}
                          className="jd-w-full"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="jd-text-muted-foreground jd-text-center jd-py-8">No placeholders found</div>
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70} minSize={40}>
          <div className="jd-h-full jd-border jd-rounded-md jd-p-4 jd-overflow-hidden jd-flex jd-flex-col">
            <h3 className="jd-text-sm jd-font-medium jd-mb-2">Edit Template</h3>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onFocus={handleEditorFocus}
              onBlur={handleEditorBlur}
              onInput={handleEditorInput}
              className={`jd-flex-1 jd-resize-none jd-border jd-rounded-md jd-p-4 jd-focus-visible:jd-outline-none jd-focus-visible:jd-ring-2 jd-focus-visible:jd-ring-primary jd-overflow-auto jd-whitespace-pre-wrap ${
                isDarkMode
                  ? "jd-bg-gray-800 jd-text-gray-100 jd-border-gray-700"
                  : "jd-bg-white jd-text-gray-900 jd-border-gray-200"
              }`}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onKeyPress={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};