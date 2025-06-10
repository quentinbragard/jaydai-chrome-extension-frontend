// src/hooks/dialogs/useCustomizeTemplateDialog.ts - FIXED: Restored original dialog integration

import { useState, useEffect } from 'react';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';
import {
  PromptMetadata,
  DEFAULT_METADATA,
  MetadataItem,
  MultipleMetadataType
} from '@/types/prompts/metadata';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';
import { useTemplateMetadataHandlers } from '@/hooks/prompts/useTemplateMetadata'; // ✅ Use shared metadata hook

export function useCustomizeTemplateDialog() {
  // ✅ Restore original dialog integration
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.PLACEHOLDER_EDITOR);
  
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState<PromptMetadata>(DEFAULT_METADATA);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  // ✅ Use shared metadata hook
  const {
    handleUpdateMetadata,
    handleAddMetadata,
    handleRemoveMetadata,
    handleUpdateMetadataItem,
    handleReorderMetadataItems
  } = useTemplateMetadataHandlers({ metadata, setMetadata });

  useEffect(() => {
    if (isOpen && data) {
      setError(null);
      setIsProcessing(true);

      const processTemplateData = async () => {
        try {
          // ✅ Fixed: Check template's content, not current state
          if (data.content) {
            const contentString = getLocalizedContent(data.content);
            setContent(contentString);
          } else {
            setContent('');
          }
          setMetadata(data.metadata || DEFAULT_METADATA);
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

  const handleComplete = (finalContent: string) => {
    try {
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
    // ✅ Unified metadata handlers
    handleUpdateMetadata,
    handleAddMetadata,
    handleRemoveMetadata,
    handleUpdateMetadataItem,
    handleReorderMetadataItems,
    handleComplete,
    handleClose,
    dialogProps
  };
}