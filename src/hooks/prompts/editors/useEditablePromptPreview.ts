// src/hooks/prompts/editors/useEditablePromptPreview.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PromptMetadata } from '@/types/prompts/metadata';
import { Block } from '@/types/prompts/blocks';
import { buildPromptPart } from '@/utils/prompts/blockUtils';
import { 
  buildCompletePreviewWithBlocks,
  buildCompletePreviewHtmlWithBlocks,
  buildCompletePreview,
  buildCompletePreviewHtml 
} from '@/utils/templates/promptPreviewUtils';

interface UseEditablePromptPreviewProps {
  metadata: PromptMetadata;
  content: string;
  blockContentCache?: Record<number, string>;
  isDarkMode: boolean;
  onContentChange?: (content: string) => void;
  onMetadataChange?: (metadata: PromptMetadata) => void;
}

export function useEditablePromptPreview({
  metadata,
  content,
  blockContentCache,
  isDarkMode,
  onContentChange,
  onMetadataChange
}: UseEditablePromptPreviewProps) {
  // Track modifications to block contents (for preview only, doesn't affect original blocks)
  const [blockContentOverrides, setBlockContentOverrides] = useState<Record<number, string>>({});
  
  // Track the main content modifications
  const [contentOverride, setContentOverride] = useState<string>('');
  
  // Initialize content override when content changes
  useEffect(() => {
    setContentOverride(content);
  }, [content]);

  // Build the effective block map (original + overrides)
  const effectiveBlockMap = useMemo(() => {
    if (!blockContentCache) return {};
    return {
      ...blockContentCache,
      ...blockContentOverrides
    };
  }, [blockContentCache, blockContentOverrides]);

  // Generate the complete preview text
  const completePreviewText = useMemo(() => {
    if (blockContentCache || Object.keys(blockContentOverrides).length > 0) {
      return buildCompletePreviewWithBlocks(metadata, contentOverride, effectiveBlockMap);
    }
    return buildCompletePreview(metadata, contentOverride);
  }, [metadata, contentOverride, effectiveBlockMap, blockContentCache, blockContentOverrides]);

  // Generate the complete preview HTML
  const completePreviewHtml = useMemo(() => {
    if (blockContentCache || Object.keys(blockContentOverrides).length > 0) {
      return buildCompletePreviewHtmlWithBlocks(metadata, contentOverride, effectiveBlockMap, isDarkMode);
    }
    return buildCompletePreviewHtml(metadata, contentOverride, isDarkMode);
  }, [metadata, contentOverride, effectiveBlockMap, isDarkMode, blockContentCache, blockContentOverrides]);

  // Parse the complete preview back into parts when edited
  const handleCompletePreviewChange = useCallback((newCompleteText: string) => {
    // Split the text into sections based on double newlines
    const sections = newCompleteText.split(/\n{2,}/);
    
    // Track which sections correspond to which metadata/blocks
    let sectionIndex = 0;
    const newBlockOverrides = { ...blockContentOverrides };
    let newContentOverride = contentOverride;

    // Helper to extract content from a section that starts with a prefix
    const extractContentFromSection = (section: string, type: string): string => {
      // Get the expected prefix patterns for this type
      const prefixPatterns = getPrefixPatterns(type);
      
      for (const pattern of prefixPatterns) {
        if (section.startsWith(pattern)) {
          return section.slice(pattern.length).trim();
        }
      }
      
      // If no prefix found, return the section as-is
      return section.trim();
    };

    // Helper to get all possible prefix patterns for a type
    const getPrefixPatterns = (type: string): string[] => {
      const patterns: string[] = [];
      
      // Get the base prefix
      const basePrefix = buildPromptPart(type as any, '');
      if (basePrefix) {
        // Add various forms of the prefix
        patterns.push(basePrefix); // "Role:\n "
        patterns.push(basePrefix.trim()); // "Role:"
        patterns.push(basePrefix.replace(/\s+/g, ' ')); // "Role: " (normalized spaces)
        patterns.push(basePrefix.replace(/\n\s*/, ' ')); // "Role: " (newline to space)
      }
      
      return patterns.filter(Boolean).sort((a, b) => b.length - a.length); // Longest first
    };

    // Process metadata sections
    const metadataTypes = ['role', 'context', 'goal', 'audience', 'output_format', 'tone_style'];
    metadataTypes.forEach(type => {
      const blockId = (metadata as any)[type];
      if (blockId && blockId !== 0 && sectionIndex < sections.length) {
        const section = sections[sectionIndex];
        const extractedContent = extractContentFromSection(section, type);
        
        // Only update if the content actually changed
        const currentContent = effectiveBlockMap[blockId] || '';
        if (extractedContent !== currentContent) {
          newBlockOverrides[blockId] = extractedContent;
        }
        sectionIndex++;
      }
    });

    // Process constraint and example sections
    if (metadata.constraints) {
      metadata.constraints.forEach(constraint => {
        if (constraint.blockId && sectionIndex < sections.length) {
          const section = sections[sectionIndex];
          const extractedContent = extractContentFromSection(section, 'constraint');
          
          const currentContent = effectiveBlockMap[constraint.blockId] || '';
          if (extractedContent !== currentContent) {
            newBlockOverrides[constraint.blockId] = extractedContent;
          }
          sectionIndex++;
        }
      });
    }

    if (metadata.examples) {
      metadata.examples.forEach(example => {
        if (example.blockId && sectionIndex < sections.length) {
          const section = sections[sectionIndex];
          const extractedContent = extractContentFromSection(section, 'example');
          
          const currentContent = effectiveBlockMap[example.blockId] || '';
          if (extractedContent !== currentContent) {
            newBlockOverrides[example.blockId] = extractedContent;
          }
          sectionIndex++;
        }
      });
    }

    // The remaining sections are the main content
    if (sectionIndex < sections.length) {
      newContentOverride = sections.slice(sectionIndex).join('\n\n');
    }

    // Update state
    setBlockContentOverrides(newBlockOverrides);
    setContentOverride(newContentOverride);

    // Notify parent components if needed
    if (onContentChange && newContentOverride !== content) {
      onContentChange(newContentOverride);
    }
  }, [metadata, blockContentOverrides, contentOverride, effectiveBlockMap, content, onContentChange]);

  // Method to reset all overrides
  const resetOverrides = useCallback(() => {
    setBlockContentOverrides({});
    setContentOverride(content);
  }, [content]);

  // Method to apply overrides (make them permanent)
  const applyOverrides = useCallback(() => {
    if (onContentChange && contentOverride !== content) {
      onContentChange(contentOverride);
    }
    // Note: Block overrides are for preview only and shouldn't modify original blocks
  }, [contentOverride, content, onContentChange]);

  // Check if there are any modifications
  const hasModifications = useMemo(() => {
    return Object.keys(blockContentOverrides).length > 0 || contentOverride !== content;
  }, [blockContentOverrides, contentOverride, content]);

  return {
    // Preview content
    completePreviewText,
    completePreviewHtml,
    
    // Editing
    handleCompletePreviewChange,
    
    // State management
    hasModifications,
    resetOverrides,
    applyOverrides,
    
    // Access to overrides for debugging/advanced use
    blockContentOverrides,
    contentOverride,
    effectiveBlockMap
  };
}