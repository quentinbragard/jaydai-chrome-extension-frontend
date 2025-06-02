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
    const uniquePlaceholders: Placeholder[] = [];

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
    const currentEffectiveContent = templateContent ? templateContent.replace(/\r\n/g, '\n') : "";

    if (mode === 'customize') {
      if (initialContentRef.current && initialContentRef.current !== "") {
        if (modifiedContent !== currentEffectiveContent) {
          setModifiedContent(currentEffectiveContent);
        }
        if(placeholders.length === 0 && currentEffectiveContent) {
          const extracted = extractPlaceholders(currentEffectiveContent);
          setPlaceholders(extracted);
        }
      } else {
        setModifiedContent(currentEffectiveContent);
        const extractedPlaceholders = extractPlaceholders(currentEffectiveContent);
        setPlaceholders(extractedPlaceholders);
        if(!initialContentRef.current && currentEffectiveContent) {
          initialContentRef.current = currentEffectiveContent;
        }
      }
    } else {
      if (!contentMounted) {
        setModifiedContent(currentEffectiveContent);
        if (!initialContentRef.current && currentEffectiveContent) {
          initialContentRef.current = currentEffectiveContent;
        }
      } else if (!isEditing && modifiedContent !== currentEffectiveContent) {
        setModifiedContent(currentEffectiveContent);
      }
    }

    const timeoutId = setTimeout(() => {
      if (editorRef.current) {
        if (mode === 'customize') {
          if (!contentMounted) {
            editorRef.current.innerHTML = highlightPlaceholders(currentEffectiveContent);
          }
        } else {
          if (!contentMounted) {
            editorRef.current.textContent = currentEffectiveContent;
          } else if (!isEditing && editorRef.current.textContent !== currentEffectiveContent) {
            editorRef.current.textContent = currentEffectiveContent;
          }
        }

        if (!contentMounted) {
          setContentMounted(true);
        }
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [templateContent, mode, contentMounted, isEditing, modifiedContent]);

  // Setup mutation observer
  useEffect(() => {
    if (!contentMounted || !editorRef.current || mode === 'create') {
      if(observerRef.current) observerRef.current.disconnect();
      return;
    }

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
      
      if (modifiedContent !== textContent) {
        setModifiedContent(textContent);

        if (mode === 'customize') {
          const extracted = extractPlaceholders(textContent);
          const oldKeys = placeholders.map(p => p.key).join();
          const newKeys = extracted.map(p => p.key).join();
          if (oldKeys !== newKeys) {
            setPlaceholders(extracted);
          }
        }
        
        if (blocks.length > 0) {
          onUpdateBlock(blocks[0].id, { content: textContent });
        }
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
  }, [contentMounted, blocks, onUpdateBlock, mode, isEditing, modifiedContent, placeholders]);

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
      let textContent = '';
      if (mode === 'create') {
        textContent = editorRef.current.textContent || '';
      } else {
        textContent = htmlContent
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
          .replace(/&amp;/g, '&')
          .replace(/\n\n+/g, '\n');
      }
      
      setModifiedContent(textContent);

      if (mode === 'customize') {
        const extracted = extractPlaceholders(textContent);
        setPlaceholders(extracted);
      }
      
      if (blocks.length > 0) {
        onUpdateBlock(blocks[0].id, { content: textContent });
      }

      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      if (mode === 'customize') {
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
    }
  };

  const handleEditorInput = () => {
    if (!editorRef.current) return;

    const currentRawContent = mode === 'create' ? (editorRef.current.textContent || '') : editorRef.current.innerHTML;

    let textContent;
    if (mode === 'create') {
      textContent = currentRawContent;
    } else {
      textContent = currentRawContent
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
        .replace(/&amp;/g, '&')
        .replace(/\n\n+/g, '\n'); 
    }
    
    setModifiedContent(textContent);

    if (mode === 'customize') {
      const extracted = extractPlaceholders(textContent);
      setPlaceholders(extracted);
    }
    
    if (blocks.length > 0) {
      onUpdateBlock(blocks[0].id, { content: textContent });
    }
  };

  // FIXED: Proper event handling like in InsertBlockDialog
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    // CRITICAL: Stop all key events from bubbling up to prevent dialog from closing
    e.stopPropagation();
    
    if (e.key === 'Escape') {
      e.preventDefault();
      editorRef.current?.blur();
      return;
    }
    
    // Let all other keys work naturally for contentEditable
  };

  const handleEditorKeyPress = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const handleEditorKeyUp = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const updatePlaceholder = (index: number, value: string) => {
    if (isEditing && mode === 'customize') return;

    activeInputIndex.current = index;

    const updatedPlaceholders = [...placeholders];
    updatedPlaceholders[index].value = value;
    setPlaceholders(updatedPlaceholders);

    let baseContent = (mode === 'customize' && initialContentRef.current ? initialContentRef.current : templateContent).replace(/\r\n/g, '\n');
    
    updatedPlaceholders.forEach(({ key, value: val }) => {
      if (val) {
        const regex = new RegExp(escapeRegExp(key), "g");
        baseContent = baseContent.replace(regex, val);
      }
    });

    setModifiedContent(baseContent);

    if (blocks.length > 0) {
      onUpdateBlock(blocks[0].id, { content: baseContent });
    }

    if (editorRef.current && !isEditing && mode === 'customize') {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      editorRef.current.innerHTML = highlightPlaceholders(baseContent);
      if (observerRef.current && editorRef.current) {
        observerRef.current.observe(editorRef.current, { 
          childList: true, 
          subtree: true, 
          characterData: true,
          attributes: false 
        });
      }
    } else if (editorRef.current && mode === 'create') {
      editorRef.current.textContent = baseContent;
    }

    setTimeout(() => {
      if (activeInputIndex.current !== null && inputRefs.current[activeInputIndex.current]) {
        inputRefs.current[activeInputIndex.current]?.focus();
      }
    }, 0);
  };

  // For create mode, show only the editor without the left panel
  if (mode === 'create') {
    return (
      <div className="jd-h-full jd-flex jd-flex-col jd-p-4">
        <h3 className="jd-text-sm jd-font-medium jd-mb-2">Edit Template</h3>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={handleEditorFocus}
          onBlur={handleEditorBlur}
          onInput={handleEditorInput}
          onKeyDown={handleEditorKeyDown}
          onKeyPress={handleEditorKeyPress}
          onKeyUp={handleEditorKeyUp}
          className={`jd-flex-1 jd-resize-none jd-border jd-rounded-md jd-p-4 jd-focus-visible:jd-outline-none jd-focus-visible:jd-ring-2 jd-focus-visible:jd-ring-primary jd-overflow-auto jd-whitespace-pre-wrap ${
            isDarkMode
              ? "jd-bg-gray-800 jd-text-gray-100 jd-border-gray-700"
              : "jd-bg-white jd-text-gray-900 jd-border-gray-200"
          }`}          
        />
      </div>
    );
  }

  // For customize mode, show the full interface with placeholders
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
                      <Input
                        ref={el => (inputRefs.current[idx] = el)}
                        onFocus={() => {
                          activeInputIndex.current = idx;
                        }}
                        // FIXED: Proper event handling for inputs
                        onKeyDown={(e) => e.stopPropagation()}
                        onKeyPress={(e) => e.stopPropagation()}
                        onKeyUp={(e) => e.stopPropagation()}
                        value={placeholder.value}
                        onChange={(e) => updatePlaceholder(idx, e.target.value)}
                        placeholder={`Enter value for ${placeholder.key}`}
                        className="jd-w-full"
                      />
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
              onKeyDown={handleEditorKeyDown}
              onKeyPress={handleEditorKeyPress}
              onKeyUp={handleEditorKeyUp}
              className={`jd-flex-1 jd-resize-none jd-border jd-rounded-md jd-p-4 jd-focus-visible:jd-outline-none jd-focus-visible:jd-ring-2 jd-focus-visible:jd-ring-primary jd-overflow-auto jd-whitespace-pre-wrap ${
                isDarkMode
                  ? "jd-bg-gray-800 jd-text-gray-100 jd-border-gray-700"
                  : "jd-bg-white jd-text-gray-900 jd-border-gray-200"
              }`}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};