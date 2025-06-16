// src/hooks/prompts/editors/useBasicEditorLogic.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
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
  content: string;
  onContentChange: (content: string) => void;
  mode: 'create' | 'customize';
}

export function useBasicEditorLogic({
  content,
  onContentChange,
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

  // Initialize content and placeholders
  useEffect(() => {
    const normalizedContent = content ? content.replace(/\r\n/g, '\n') : '';

    if (mode === 'customize') {
      // For customize mode, extract placeholders and set up highlighting
      if (initialContentRef.current === '' && normalizedContent) {
        initialContentRef.current = normalizedContent;
      }
      
      if (modifiedContent !== normalizedContent) {
        setModifiedContent(normalizedContent);
      }
      
      if (placeholders.length === 0 && normalizedContent) {
        const extracted = extractPlaceholders(normalizedContent);
        setPlaceholders(extracted);
      }
    } else {
      // For create mode, just set the content
      if (!contentMounted) {
        setModifiedContent(normalizedContent);
        if (!initialContentRef.current && normalizedContent) {
          initialContentRef.current = normalizedContent;
        }
      } else if (!isEditing && modifiedContent !== normalizedContent) {
        setModifiedContent(normalizedContent);
      }
    }

    // Update editor display
    const timeoutId = setTimeout(() => {
      if (editorRef.current) {
        if (mode === 'customize') {
          if (!contentMounted) {
            editorRef.current.innerHTML = highlightPlaceholders(normalizedContent);
          }
        } else {
          if (!contentMounted) {
            editorRef.current.innerHTML = normalizedContent.replace(/\n/g, '<br>');
          } else if (!isEditing && editorRef.current.innerText !== normalizedContent) {
            editorRef.current.innerHTML = normalizedContent.replace(/\n/g, '<br>');
          }
        }

        if (!contentMounted) {
          setContentMounted(true);
        }
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [content, mode, contentMounted, isEditing, modifiedContent, placeholders.length]);

  // Setup mutation observer for customize mode
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
        
        onContentChange(textContent);
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
  }, [contentMounted, onContentChange, mode, isEditing, modifiedContent, placeholders]);

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
      const textContent = htmlToPlainText(htmlContent);
      
      setModifiedContent(textContent);

      if (mode === 'customize') {
        const extracted = extractPlaceholders(textContent);
        setPlaceholders(extracted);
      }
      
      onContentChange(textContent);

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
  }, [onContentChange, mode]);

  const handleEditorInput = useCallback(() => {
    if (!editorRef.current) return;

    const currentHtml = editorRef.current.innerHTML;
    const textContent = htmlToPlainText(currentHtml);
    
    setModifiedContent(textContent);

    if (mode === 'customize') {
      const extracted = extractPlaceholders(textContent);
      setPlaceholders(extracted);
    }
    
    onContentChange(textContent);
  }, [onContentChange, mode]);

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
      : content).replace(/\r\n/g, '\n');

    const values = updatedPlaceholders.reduce<Record<string, string>>((acc, p) => {
      if (p.value) acc[p.key] = p.value;
      return acc;
    }, {});

    baseContent = replacePlaceholders(baseContent, values);

    setModifiedContent(baseContent);
    onContentChange(baseContent);

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
      editorRef.current.innerHTML = baseContent.replace(/\n/g, '<br>');
    }

    setTimeout(() => {
      if (activeInputIndex.current !== null && inputRefs.current[activeInputIndex.current]) {
        inputRefs.current[activeInputIndex.current]?.focus();
      }
    }, 0);
  }, [isEditing, mode, placeholders, content, onContentChange]);

  return {
    // State
    placeholders,
    modifiedContent,
    contentMounted,
    isEditing,
    
    // Refs
    editorRef,
    inputRefs,
    activeInputIndex,
    
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