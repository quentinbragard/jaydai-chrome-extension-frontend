import { useState, useEffect } from 'react';
import { useDialog } from '@/hooks/dialogs/useDialog';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';
import { Block, BlockType } from '@/types/prompts/blocks';
import { PromptMetadata, DEFAULT_METADATA, ALL_METADATA_TYPES } from '@/types/prompts/metadata';
import { getLocalizedContent } from '@/components/prompts/blocks/blockUtils';
import { formatBlockForPrompt, formatMetadataForPrompt } from '@/components/prompts/promptUtils';

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
        if (data.expanded_blocks && Array.isArray(data.expanded_blocks)) {
          templateBlocks = data.expanded_blocks.map((block: any, index: number) => ({
            id: block.id || Date.now() + index,
            type: block.type || 'content',
            content: getLocalizedContent(block.content) || '',
            title: block.title || { en: `${(block.type || 'content').charAt(0).toUpperCase() + (block.type || 'content').slice(1)} Block` },
            description: block.description || ''
          }));
        } else if (data.content) {
          const contentString = getLocalizedContent(data.content);
          templateBlocks = [{
            id: Date.now(),
            type: 'content',
            content: contentString,
            title: { en: 'Template Content' }
          }];
        }
        setBlocks(templateBlocks);
        setMetadata(DEFAULT_METADATA);
      } catch (err) {
        console.error('PlaceholderEditor: Error processing template:', err);
        setError(getMessage('errorProcessingTemplate'));
      } finally {
        setIsProcessing(false);
      }
    }
  }, [isOpen, data]);

  const handleAddBlock = (
    position: 'start' | 'end',
    blockType?: BlockType | null,
    existingBlock?: Block
  ) => {
    const newBlock: Block = existingBlock
      ? { ...existingBlock, isNew: false }
      : {
          id: Date.now() + Math.random(),
          type: blockType || null,
          content: '',
          name: blockType
            ? `New ${blockType.charAt(0).toUpperCase() + blockType.slice(1)} Block`
            : 'New Block',
          description: '',
          isNew: true
        };

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

  const handleComplete = () => {
    try {
      const parts: string[] = [];
      ALL_METADATA_TYPES.forEach(type => {
        const value = metadata.values?.[type];
        if (value) parts.push(formatMetadataForPrompt(type, value));
      });
      blocks.forEach(block => {
        const formatted = formatBlockForPrompt(block);
        if (formatted) parts.push(formatted);
      });
      const finalContent = parts.filter(Boolean).join('\n\n');
      if (data && data.onComplete) {
        data.onComplete(finalContent);
      }
      dialogProps.onOpenChange(false);
      trackEvent(EVENTS.TEMPLATE_USED, {
        template_id: data?.id,
        template_name: data?.title,
        template_type: data?.type,
        editor_mode: activeTab
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
    handleComplete,
    handleClose,
    dialogProps
  };
}
