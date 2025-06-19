// src/hooks/prompts/editors/useBasicEditorLogic.ts - Fixed Version
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
  
  // **NEW: Keep track of original content with placeholders**
  const originalContentRef = useRef(content);
  const placeholdersInitializedRef = useRef(false);

  // **FIXED: Initialize content and placeholders (only once)**
  useEffect(() => {
    // Only initialize placeholders once when component mounts or content initially changes
    if (mode === 'customize' && !placeholdersInitializedRef.current) {
      const extracted = extractPlaceholders(content);
      const uniqueKeys = Array.from(new Set(extracted.map(p => p.key)));
      setPlaceholders(uniqueKeys.map(key => ({ key, value: '' })));
      originalContentRef.current = content;
      placeholdersInitializedRef.current = true;
    }
    
    setModifiedContent(content);
    lastCommittedContentRef.current = content;
    setContentMounted(true);
  }, []); // **CHANGED: Only run once on mount**

  // **NEW: Handle external content changes (like tab switching)**
  useEffect(() => {
    if (placeholdersInitializedRef.current && content !== lastCommittedContentRef.current) {
      // If content changed externally, update our state but keep placeholders
      setModifiedContent(content);
      lastCommittedContentRef.current = content;
      
      // Update original content reference if it's a completely new template
      if (!placeholders.length || content.length < originalContentRef.current.length / 2) {
        originalContentRef.current = content;
        // Re-extract placeholders if this looks like a new template
        if (mode === 'customize') {
          const extracted = extractPlaceholders(content);
          const uniqueKeys = Array.from(new Set(extracted.map(p => p.key)));
          setPlaceholders(uniqueKeys.map(key => ({ key, value: '' })));
        }
      }
    }
  }, [content, mode, placeholders.length]);

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

  // Editor event handlers
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

  // **FIXED: Placeholder update that maintains placeholder list**
  const updatePlaceholder = useCallback((index: number, value: string) => {
    setPlaceholders(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated; // Return updated placeholders without modifying content here
    });

    // **NEW: Update content separately, using original content as base**
    const placeholderMap = placeholders.reduce((acc, p, i) => {
      // Use the new value for the current index, existing values for others
      acc[p.key] = i === index ? value : p.value;
      return acc;
    }, {} as Record<string, string>);
    
    // **FIXED: Always use original content as base for replacement**
    const newContent = replacePlaceholders(originalContentRef.current, placeholderMap);
    updateContentInternal(newContent);
  }, [placeholders, updateContentInternal]);

  // **NEW: Function to reset placeholders to original state**
  const resetPlaceholders = useCallback(() => {
    setPlaceholders(prev => prev.map(p => ({ ...p, value: '' })));
    setModifiedContent(originalContentRef.current);
    updateContentInternal(originalContentRef.current);
  }, [updateContentInternal]);

  // **NEW: Function to get current placeholder values**
  const getPlaceholderValues = useCallback(() => {
    return placeholders.reduce((acc, p) => {
      acc[p.key] = p.value;
      return acc;
    }, {} as Record<string, string>);
  }, [placeholders]);

  // Cleanup effect to commit changes when component unmounts or content changes externally
  useEffect(() => {
    return () => {
      commitPendingChanges();
    };
  }, [commitPendingChanges]);

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
    
    // Enhanced methods
    forceCommitChanges,
    resetPlaceholders,
    getPlaceholderValues,
    
    // State indicators
    hasPendingChanges: pendingChangesRef.current !== null,
  };
}