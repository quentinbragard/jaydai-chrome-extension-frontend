// src/hooks/prompts/editors/useBasicEditorLogic.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import { extractPlaceholders, replacePlaceholders } from '@/utils/templates/placeholderUtils';

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
  // Core state
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [modifiedContent, setModifiedContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [contentMounted, setContentMounted] = useState(false);

  // Refs for DOM elements
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const activeInputIndex = useRef<number | null>(null);

  // Track pending changes that need to be committed
  const pendingChangesRef = useRef<string | null>(null);
  const lastCommittedContentRef = useRef(content);

  // Initialize content and placeholders
  useEffect(() => {
    setModifiedContent(content);
    lastCommittedContentRef.current = content;
    
    if (mode === 'customize') {
      const extracted = extractPlaceholders(content);
      const uniqueKeys = Array.from(new Set(extracted.map(p => p.key)));
      setPlaceholders(uniqueKeys.map(key => ({ key, value: '' })));
    }
    
    setContentMounted(true);
  }, [content, mode]);

  // Commit pending changes function
  const commitPendingChanges = useCallback(() => {
    if (pendingChangesRef.current !== null && pendingChangesRef.current !== lastCommittedContentRef.current) {
      onContentChange(pendingChangesRef.current);
      lastCommittedContentRef.current = pendingChangesRef.current;
      pendingChangesRef.current = null;
    }
  }, [onContentChange]);

  // Update content with debouncing and change tracking
  const updateContentInternal = useCallback((newContent: string) => {
    setModifiedContent(newContent);
    pendingChangesRef.current = newContent;
    
    // Debounced commit
    const timeoutId = setTimeout(() => {
      commitPendingChanges();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [commitPendingChanges]);

  //  editor event handlers
  const handleEditorFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleEditorBlur = useCallback(() => {
    setIsEditing(false);
    // Commit changes when losing focus
    setTimeout(commitPendingChanges, 100);
  }, [commitPendingChanges]);

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.textContent || '';
      updateContentInternal(newContent);
    }
  }, [updateContentInternal]);

  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    
    if (e.key === 'Tab') {
      e.preventDefault();
      // Focus next placeholder input if available
      if (activeInputIndex.current !== null) {
        const nextIndex = activeInputIndex.current + 1;
        const nextInput = inputRefs.current[nextIndex];
        if (nextInput) {
          nextInput.focus();
          activeInputIndex.current = nextIndex;
        }
      }
    }
  }, []);

  const handleEditorKeyPress = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  const handleEditorKeyUp = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  //  placeholder update with immediate preview update
  const updatePlaceholder = useCallback((index: number, value: string) => {
    setPlaceholders(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      
      // Update content with new placeholder values
      const placeholderMap = updated.reduce((acc, p) => {
        acc[p.key] = p.value;
        return acc;
      }, {} as Record<string, string>);
      
      const newContent = replacePlaceholders(content, placeholderMap);
      updateContentInternal(newContent);
      
      return updated;
    });
  }, [content, updateContentInternal]);

  // Cleanup effect to commit changes when component unmounts or content changes externally
  useEffect(() => {
    return () => {
      commitPendingChanges();
    };
  }, [commitPendingChanges]);

  // Commit changes when content prop changes (e.g., tab switching)
  useEffect(() => {
    if (content !== lastCommittedContentRef.current) {
      commitPendingChanges();
    }
  }, [content, commitPendingChanges]);

  // Public method to force commit (useful for tab switching)
  const forceCommitChanges = useCallback(() => {
    commitPendingChanges();
  }, [commitPendingChanges]);

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
    updatePlaceholder,
    
    //  methods
    forceCommitChanges,
    
    // State indicators
    hasPendingChanges: pendingChangesRef.current !== null,
  };
}