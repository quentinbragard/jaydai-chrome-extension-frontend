// src/components/dialogs/prompts/editors/BasicEditor/hooks/useBasicEditorLogic.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { Block } from '@/types/prompts/blocks';
import { getCurrentLanguage } from '@/core/utils/i18n';
import {
  highlightPlaceholders,
  extractPlaceholders,
  replacePlaceholders
} from '@/utils/templates/placeholderUtils';
import { htmlToPlainText } from '@/utils/templates/htmlUtils';

interface Placeholder {
  key: string;
  value: string;
}

interface UseBasicEditorLogicProps {
  blocks: Block[];
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  mode: 'create' | 'customize';
}

export function useBasicEditorLogic({
  blocks,
  onUpdateBlock,
  mode
}: UseBasicEditorLogicProps) {
  // State
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [modifiedContent, setModifiedContent] = useState('');
  const [contentMounted, setContentMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const activeInputIndex = useRef<number | null>(null);
  const initialContentRef = useRef('');

  // Get combined content from all blocks
  const getBlockContent = useCallback((block: Block): string => {
    if (typeof block.content === 'string') {
      return block.content;
    } else if (block.content && typeof block.content === 'object') {
      const locale = getCurrentLanguage();
      return block.content[locale] || block.content.en || Object.values(block.content)[0] || '';
    }
    return '';
  }, []);

  const templateContent = mode === 'customize' && initialContentRef.current
    ? initialContentRef.current
    : blocks.map(block => getBlockContent(block)).join('\n\n');

  // Initialize content and placeholders
  useEffect(() => {
    const currentEffectiveContent = templateContent ? templateContent.replace(/\r\n/g, '\n') : "";

    if (mode === 'customize') {
      if (initialContentRef.current && initialContentRef.current !== "") {
        if (modifiedContent !== currentEffectiveContent) {
          setModifiedContent(currentEffectiveContent);
        }
        if (placeholders.length === 0 && currentEffectiveContent) {
          const extracted = extractPlaceholders(currentEffectiveContent);
          setPlaceholders(extracted);
        }
      } else {
        setModifiedContent(currentEffectiveContent);
        const extractedPlaceholders = extractPlaceholders(currentEffectiveContent);
        setPlaceholders(extractedPlaceholders);
        if (!initialContentRef.current && currentEffectiveContent) {
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
  }, [templateContent, mode, contentMounted, isEditing, modifiedContent, placeholders.length]);

  // Setup mutation observer
  useEffect(() => {
    if (!contentMounted || !editorRef.current || mode === 'create') {
      if (observerRef.current) observerRef.current.disconnect();
      return;
    }

    observerRef.current = new MutationObserver(() => {
      if (isEditing || !editorRef.current) return;

      const htmlContent = editorRef.current.innerHTML;
      const textContent = htmlToPlainText(htmlContent);
      
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

  // Event handlers
  const handleEditorFocus = useCallback(() => {
    setIsEditing(true);
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);

  const handleEditorBlur = useCallback(() => {
    setIsEditing(false);
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;
      const textContent = mode === 'create'
        ? editorRef.current.textContent || ''
        : htmlToPlainText(htmlContent);
      
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
  }, [blocks, mode, onUpdateBlock]);

  const handleEditorInput = useCallback(() => {
    if (!editorRef.current) return;

    const currentRawContent = mode === 'create'
      ? editorRef.current.textContent || ''
      : editorRef.current.innerHTML;

    const textContent = mode === 'create'
      ? currentRawContent
      : htmlToPlainText(currentRawContent);
    
    setModifiedContent(textContent);

    if (mode === 'customize') {
      const extracted = extractPlaceholders(textContent);
      setPlaceholders(extracted);
    }
    
    if (blocks.length > 0) {
      onUpdateBlock(blocks[0].id, { content: textContent });
    }
  }, [blocks, mode, onUpdateBlock]);

  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent) => {
    // CRITICAL: Stop all key events from bubbling up to prevent dialog from closing
    e.stopPropagation();
    
    if (e.key === 'Escape') {
      e.preventDefault();
      editorRef.current?.blur();
      return;
    }
    
    // Let all other keys work naturally for contentEditable
  }, []);

  const handleEditorKeyPress = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  const handleEditorKeyUp = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  const updatePlaceholder = useCallback((index: number, value: string) => {
    if (isEditing && mode === 'customize') return;

    activeInputIndex.current = index;

    const updatedPlaceholders = [...placeholders];
    updatedPlaceholders[index].value = value;
    setPlaceholders(updatedPlaceholders);

    let baseContent = (mode === 'customize' && initialContentRef.current
      ? initialContentRef.current
      : templateContent).replace(/\r\n/g, '\n');

    const values = updatedPlaceholders.reduce<Record<string, string>>((acc, p) => {
      if (p.value) acc[p.key] = p.value;
      return acc;
    }, {});

    baseContent = replacePlaceholders(baseContent, values);

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
  }, [isEditing, mode, placeholders, templateContent, blocks, onUpdateBlock]);

  return {
    // State
    placeholders,
    modifiedContent,
    contentMounted,
    isEditing,
    
    // Refs
    editorRef,
    observerRef,
    inputRefs,
    activeInputIndex,
    
    // Content management
    templateContent,
    
    // Event handlers
    handleEditorFocus,
    handleEditorBlur,
    handleEditorInput,
    handleEditorKeyDown,
    handleEditorKeyPress,
    handleEditorKeyUp,
    updatePlaceholder
  };
}