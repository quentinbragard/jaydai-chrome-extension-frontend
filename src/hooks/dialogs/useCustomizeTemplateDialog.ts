// src/hooks/dialogs/useCustomizeTemplateDialog.ts
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
  MultipleMetadataType
} from '@/types/prompts/metadata';
import { getLocalizedContent } from '@/components/prompts/blocks/blockUtils';
import { buildCompletePrompt } from '@/components/prompts/promptUtils';
import {
  createBlock,
  addBlock as addBlockUtil,
  removeBlock as removeBlockUtil,
  updateBlock as updateBlockUtil,
  moveBlock as moveBlockUtil,
  reorderBlocks as reorderBlocksUtil,
  addMetadataItem,
  removeMetadataItem,
  updateMetadataItem,
  reorderMetadataItems
} from './templateDialogUtils';
import { prefillMetadataFromMapping } from '@/utils/templates/metadataPrefill';

export function useCustomizeTemplateDialog() {
  const { isOpen, data, dialogProps } = useDialog('placeholderEditor');
  const [content, setContent] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [metadata, setMetadata] = useState<PromptMetadata>(DEFAULT_METADATA);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  useEffect(() => {
    if (isOpen && data) {
      setError(null);
      setIsProcessing(true);
      
      const processTemplateData = async () => {
        try {
          let templateBlocks: Block[] = [];
          let templateMetadata: PromptMetadata = { ...DEFAULT_METADATA };

          if (data.content) {
            const contentString = getLocalizedContent(data.content);
            setContent(contentString);
            templateBlocks = [{
              id: Date.now(),
              type: 'custom',
              content: contentString,
              title: { en: 'Template Content' }
            }];
          } else {
            setContent('');
          }

          setBlocks(templateBlocks);

          // ✅ Handle metadata properly
          if (data.metadata && Object.keys(data.metadata).length > 0) {
            console.log('Processing template metadata:', data.metadata);
            try {
              // Convert the metadata mapping back to metadata structure
              templateMetadata = await prefillMetadataFromMapping(data.metadata);
              console.log('Prefilled metadata:', templateMetadata);
            } catch (metadataError) {
              console.error('Error processing metadata:', metadataError);
              // Don't fail completely, just use default metadata
              templateMetadata = { ...DEFAULT_METADATA };
            }
          }

          setMetadata(templateMetadata);
        } catch (err) {
          console.error('CustomizeTemplateDialog: Error processing template:', err);
          setError(getMessage('errorProcessingTemplate'));
        } finally {
          setIsProcessing(false);
        }
      };

      processTemplateData();
    }
  }, [isOpen, data]);


  const handleAddBlock = (
    position: 'start' | 'end',
    blockType?: BlockType | null,
    existingBlock?: Block,
    duplicate?: boolean
  ) => {
    const newBlock = createBlock(blockType, existingBlock, duplicate);
    setBlocks(prev => addBlockUtil(prev, position, newBlock));
  };

  const handleRemoveBlock = (blockId: number) => {
    if (blocks.length <= 1) {
      toast.warning(getMessage('cannotRemoveLastBlock'));
      return;
    }
    setBlocks(prev => removeBlockUtil(prev, blockId));
  };

  const handleUpdateBlock = (blockId: number, updatedBlock: Partial<Block>) => {
    setBlocks(prev => {
      const newBlocks = updateBlockUtil(prev, blockId, updatedBlock);
      if (newBlocks.length > 0 && newBlocks[0].id === blockId) {
        const first = newBlocks[0];
        const newContent = typeof first.content === 'string' ? first.content : getLocalizedContent(first.content);
        setContent(newContent);
      }
      return newBlocks;
    });
  };

  const handleMoveBlock = (blockId: number, direction: 'up' | 'down') => {
    setBlocks(prev => moveBlockUtil(prev, blockId, direction));
  };

  const handleReorderBlocks = (newBlocks: Block[]) => {
    setBlocks(prev => reorderBlocksUtil(prev, newBlocks));
  };

  const handleUpdateMetadata = (newMetadata: PromptMetadata) => {
    setMetadata(newMetadata);
  };

  // Enhanced metadata handlers
  const handleAddMetadataItem = (type: MultipleMetadataType) => {
    setMetadata(prev => addMetadataItem(prev, type));
  };

  const handleRemoveMetadataItem = (type: MultipleMetadataType, itemId: string) => {
    setMetadata(prev => removeMetadataItem(prev, type, itemId));
  };

  const handleUpdateMetadataItem = (
    type: MultipleMetadataType,
    itemId: string,
    updates: Partial<MetadataItem>
  ) => {
    setMetadata(prev => updateMetadataItem(prev, type, itemId, updates));
  };

  const handleReorderMetadataItems = (type: MultipleMetadataType, newItems: MetadataItem[]) => {
    setMetadata(prev => reorderMetadataItems(prev, type, newItems));
  };

  const handleComplete = () => {
    try {
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
    content,
    setContent,
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
