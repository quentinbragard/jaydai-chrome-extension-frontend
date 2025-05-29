// src/hooks/dialogs/useCustomizeTemplateDialog.ts - Enhanced version
import { useState, useEffect } from 'react';
import { useDialog } from '@/hooks/dialogs/useDialog';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';
import { Block, BlockType } from '@/types/prompts/blocks';
import { 
  PromptMetadata, 
  DEFAULT_METADATA, 
  MetadataItem,
  MultipleMetadataType,
  SingleMetadataType,
  isMultipleMetadataType,
  generateMetadataItemId
} from '@/types/prompts/metadata';
import { getLocalizedContent } from '@/components/prompts/blocks/blockUtils';
import { buildCompletePrompt } from '@/components/prompts/promptUtils';

export function useCustomizeTemplateDialog() {
  const { isOpen, data, dialogProps } = useDialog('placeholderEditor');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [metadata, setMetadata] = useState<PromptMetadata>(DEFAULT_METADATA);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  useEffect(() => {
    if (isOpen && data) {
      setError(null);
      setIsProcessing(true);
      try {
        let templateBlocks: Block[] = [];
        let templateMetadata: PromptMetadata = { ...DEFAULT_METADATA };

        if (data.expanded_blocks && Array.isArray(data.expanded_blocks)) {
          templateBlocks = data.expanded_blocks.map((block: any, index: number) => ({
            id: block.id || Date.now() + index,
            type: block.type || 'content',
            content: getLocalizedContent(block.content) || '',
            title: block.title || { en: `${(block.type || 'content').charAt(0).toUpperCase() + (block.type || 'content').slice(1)} Block` },
            description: block.description || ''
          }));

          // Parse enhanced metadata from blocks if available
          if (data.enhanced_metadata) {
            templateMetadata = parseEnhancedMetadata(data.enhanced_metadata);
          }
        } else if (data.content) {
          const contentString = getLocalizedContent(data.content);
          templateBlocks = [{
            id: Date.now(),
            type: 'content',
            content: contentString,
            title: { en: 'Template Content' }
          }];

          // Try to extract metadata from content structure if it follows the enhanced format
          templateMetadata = extractMetadataFromContent(contentString);
        }

        setBlocks(templateBlocks);
        setMetadata(templateMetadata);
      } catch (err) {
        console.error('PlaceholderEditor: Error processing template:', err);
        setError(getMessage('errorProcessingTemplate'));
      } finally {
        setIsProcessing(false);
      }
    }
  }, [isOpen, data]);

  // Helper function to parse enhanced metadata from template data
  const parseEnhancedMetadata = (enhancedMetadata: any): PromptMetadata => {
    const parsedMetadata: PromptMetadata = { ...DEFAULT_METADATA };

    // Parse single metadata values
    if (enhancedMetadata.values) {
      parsedMetadata.values = { ...enhancedMetadata.values };
    }

    // Parse single metadata block references
    ['role', 'context', 'goal', 'audience', 'tone_style', 'output_format'].forEach(type => {
      if (enhancedMetadata[type]) {
        parsedMetadata[type as SingleMetadataType] = enhancedMetadata[type];
      }
    });

    // Parse multiple metadata items
    if (enhancedMetadata.constraints && Array.isArray(enhancedMetadata.constraints)) {
      parsedMetadata.constraints = enhancedMetadata.constraints.map((item: any) => ({
        id: item.id || generateMetadataItemId(),
        blockId: item.blockId,
        value: item.value || ''
      }));
    }

    if (enhancedMetadata.examples && Array.isArray(enhancedMetadata.examples)) {
      parsedMetadata.examples = enhancedMetadata.examples.map((item: any) => ({
        id: item.id || generateMetadataItemId(),
        blockId: item.blockId,
        value: item.value || ''
      }));
    }

    return parsedMetadata;
  };

  // Helper function to extract metadata from content string (basic parsing)
  const extractMetadataFromContent = (content: string): PromptMetadata => {
    const extractedMetadata: PromptMetadata = { ...DEFAULT_METADATA };
    
    // Simple parsing logic - look for patterns like "Ton rôle est de: ..."
    const lines = content.split('\n').filter(line => line.trim());
    
    const constraintItems: MetadataItem[] = [];
    const exampleItems: MetadataItem[] = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Look for constraints
      if (trimmedLine.startsWith('Contrainte:')) {
        constraintItems.push({
          id: generateMetadataItemId(),
          value: trimmedLine.replace('Contrainte:', '').trim()
        });
      }
      
      // Look for examples
      if (trimmedLine.startsWith('Exemple:')) {
        exampleItems.push({
          id: generateMetadataItemId(),
          value: trimmedLine.replace('Exemple:', '').trim()
        });
      }
    });

    if (constraintItems.length > 0) {
      extractedMetadata.constraints = constraintItems;
    }

    if (exampleItems.length > 0) {
      extractedMetadata.examples = exampleItems;
    }

    return extractedMetadata;
  };

  const handleAddBlock = (
    position: 'start' | 'end',
    blockType?: BlockType | null,
    existingBlock?: Block,
    duplicate?: boolean
  ) => {
    let newBlock: Block;

    if (existingBlock) {
      newBlock = duplicate
        ? {
            ...existingBlock,
            id: Date.now() + Math.random(),
            isNew: true
          }
        : { ...existingBlock, isNew: false };
    } else {
      newBlock = {
        id: Date.now() + Math.random(),
        type: blockType || null,
        content: '',
        name: blockType
          ? `New ${blockType.charAt(0).toUpperCase() + blockType.slice(1)} Block`
          : 'New Block',
        description: '',
        isNew: true
      };
    }

    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      if (position === 'start') {
        newBlocks.unshift(newBlock);
      } else {
        newBlocks.push(newBlock);
      }
      return newBlocks;
    });
  };

  const handleRemoveBlock = (blockId: number) => {
    if (blocks.length <= 1) {
      toast.warning(getMessage('cannotRemoveLastBlock'));
      return;
    }
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));
  };

  const handleUpdateBlock = (blockId: number, updatedBlock: Partial<Block>) => {
    setBlocks(prevBlocks => prevBlocks.map(block => (block.id === blockId ? { ...block, ...updatedBlock } : block)));
  };

  const handleMoveBlock = (blockId: number, direction: 'up' | 'down') => {
    setBlocks(prevBlocks => {
      const currentIndex = prevBlocks.findIndex(block => block.id === blockId);
      if (currentIndex === -1 || (direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === prevBlocks.length - 1)) {
        return prevBlocks;
      }
      const newBlocks = [...prevBlocks];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      [newBlocks[currentIndex], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[currentIndex]];
      return newBlocks;
    });
  };

  const handleReorderBlocks = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
  };

  const handleUpdateMetadata = (newMetadata: PromptMetadata) => {
    setMetadata(newMetadata);
  };

  // Enhanced metadata handlers
  const handleAddMetadataItem = (type: MultipleMetadataType) => {
    const newItem: MetadataItem = {
      id: generateMetadataItemId(),
      value: ''
    };

    setMetadata(prev => ({
      ...prev,
      [type]: [...(prev[type] || []), newItem]
    }));
  };

  const handleRemoveMetadataItem = (type: MultipleMetadataType, itemId: string) => {
    setMetadata(prev => ({
      ...prev,
      [type]: (prev[type] || []).filter(item => item.id !== itemId)
    }));
  };

  const handleUpdateMetadataItem = (type: MultipleMetadataType, itemId: string, updates: Partial<MetadataItem>) => {
    setMetadata(prev => ({
      ...prev,
      [type]: (prev[type] || []).map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  };

  const handleReorderMetadataItems = (type: MultipleMetadataType, newItems: MetadataItem[]) => {
    setMetadata(prev => ({
      ...prev,
      [type]: newItems
    }));
  };

  const handleComplete = () => {
    try {
      // Use the enhanced prompt building function
      const finalContent = buildCompletePrompt(metadata, blocks);
      
      if (data && data.onComplete) {
        data.onComplete(finalContent);
      }
      dialogProps.onOpenChange(false);
      trackEvent(EVENTS.TEMPLATE_USED, {
        template_id: data?.id,
        template_name: data?.title,
        template_type: data?.type,
        editor_mode: activeTab,
        metadata_items_count: (metadata.constraints?.length || 0) + (metadata.examples?.length || 0),
        has_constraints: (metadata.constraints?.length || 0) > 0,
        has_examples: (metadata.examples?.length || 0) > 0
      });
      document.dispatchEvent(new CustomEvent('jaydai:placeholder-editor-closed'));
      document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
    } catch (error) {
      console.error('PlaceholderEditor: Error in handleComplete:', error);
      toast.error(getMessage('errorProcessingTemplateToast'));
    }
  };

  const handleClose = () => {
    try {
      dialogProps.onOpenChange(false);
      document.dispatchEvent(new CustomEvent('jaydai:placeholder-editor-closed'));
      document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
    } catch (error) {
      console.error('PlaceholderEditor: Error in handleClose:', error);
    }
  };

  return {
    isOpen,
    error,
    blocks,
    metadata,
    isProcessing,
    activeTab,
    setActiveTab,
    handleAddBlock,
    handleRemoveBlock,
    handleUpdateBlock,
    handleMoveBlock,
    handleReorderBlocks,
    handleUpdateMetadata,
    // Enhanced metadata handlers
    handleAddMetadataItem,
    handleRemoveMetadataItem,
    handleUpdateMetadataItem,
    handleReorderMetadataItems,
    handleComplete,
    handleClose,
    dialogProps
  };
}