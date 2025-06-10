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
  addMetadataItem,
  removeMetadataItem,
  updateMetadataItem,
  reorderMetadataItems
} from './templateDialogUtils';
import { prefillMetadataFromMapping, parseMetadataIds } from '@/utils/templates/metadataPrefill';

export function useCustomizeTemplateDialog() {
  const { isOpen, data, dialogProps } = useDialog('placeholderEditor');
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState<PromptMetadata>(DEFAULT_METADATA);
  const [finalPromptContent, setFinalPromptContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  useEffect(() => {
    if (isOpen && data) {
      setError(null);
      setIsProcessing(true);

      const processTemplateData = async () => {
        try {
          if (data.content) {
            const contentString = getLocalizedContent(data.content);
            setContent(contentString);
          } else {
            setContent('');
          }
          setMetadata(data.metadata);
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

  // Keep final prompt content in sync with metadata and content
  useEffect(() => {
    setFinalPromptContent(buildCompletePrompt(metadata, content));
  }, [metadata, content]);

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
      const finalContent = finalPromptContent;
      
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
    metadata,
    isProcessing,
    activeTab,
    setActiveTab,
    finalPromptContent,
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
