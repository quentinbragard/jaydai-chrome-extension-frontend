// src/hooks/dialogs/useCreateTemplateDialog.ts - Enhanced Version
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { useTemplateDialogBase } from './useTemplateDialogBase';
import { useTemplateCreation } from '@/hooks/prompts/useTemplateCreation';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';
import { PromptMetadata } from '@/types/prompts/metadata';
import { metadataToBlockMapping } from '@/utils/prompts/metadataUtils';
import { blocksApi } from '@/services/api/BlocksApi';

export function useCreateTemplateDialog() {
  const createDialog = useDialog(DIALOG_TYPES.CREATE_TEMPLATE);
  const editDialog = useDialog(DIALOG_TYPES.EDIT_TEMPLATE);
  const { saveTemplate } = useTemplateCreation();
  
  const isOpen = createDialog.isOpen || editDialog.isOpen;
  const isEditMode = editDialog.isOpen;
  const data = createDialog.isOpen ? createDialog.data : editDialog.data;
  
  const handleComplete = async (
    content: string, 
    metadata: PromptMetadata, 
    finalContent?: string
  ): Promise<boolean> => {
    try {
      // **NEW: Handle block modifications for create mode**
      let finalMetadata = metadata;
      
      if (!isEditMode && baseHook.modifiedMetadata && Object.keys(baseHook.modifiedMetadata).length > 0) {
        console.log('Creating new blocks for modifications:', baseHook.modifiedMetadata);
        
        // Create new blocks for modified content
        const newBlocksMap: Record<number, number> = {}; // originalId -> newId
        
        for (const [originalBlockIdStr, newContent] of Object.entries(baseHook.modifiedMetadata)) {
          const originalBlockId = parseInt(originalBlockIdStr, 10);
          
          try {
            // Get original block info
            const originalBlockResponse = await blocksApi.getBlock(originalBlockId);
            if (!originalBlockResponse.success || !originalBlockResponse.data) {
              console.warn(`Could not fetch original block ${originalBlockId}`);
              continue;
            }
            
            const originalBlock = originalBlockResponse.data;
            
            // Create new block with modified content
            const newBlockData = {
              title: `${originalBlock.title} (Modified)`,
              content: newContent,
              type: originalBlock.type,
              is_published: false, // Mark as unpublished
              parent_block_id: originalBlockId,
              description: `Modified version of block ${originalBlockId}`
            };
            
            console.log('Creating new block:', newBlockData);
            const createResponse = await blocksApi.createBlock(newBlockData);
            
            if (createResponse.success && createResponse.data) {
              newBlocksMap[originalBlockId] = createResponse.data.id;
              console.log(`Created new block ${createResponse.data.id} for original ${originalBlockId}`);
            } else {
              console.error(`Failed to create new block for ${originalBlockId}:`, createResponse.message);
            }
          } catch (error) {
            console.error(`Error creating new block for ${originalBlockId}:`, error);
          }
        }
        
        // **NEW: Update metadata to use new block IDs**
        if (Object.keys(newBlocksMap).length > 0) {
          finalMetadata = updateMetadataWithNewBlocks(metadata, newBlocksMap);
          console.log('Updated metadata with new block IDs:', finalMetadata);
        }
      }
      
      // Use final content if available, otherwise use base content
      const contentToSave = finalContent || content;
      
      const formData = {
        name: baseHook.name.trim(),
        content: contentToSave,
        description: baseHook.description?.trim(),
        folder_id: baseHook.selectedFolderId ? parseInt(baseHook.selectedFolderId, 10) : undefined,
        metadata: metadataToBlockMapping(finalMetadata)
      };
      
      console.log('Saving template with data:', formData);
      
      const currentTemplate = data?.template;
      const success = await saveTemplate(formData, currentTemplate?.id);
      
      if (success) {
        if (currentTemplate) {
          // Refresh page for edit
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(getMessage('errorSavingTemplate', undefined, 'Error saving template'));
      return false;
    }
  };
  
  const handleClose = () => {
    if (createDialog.isOpen) {
      createDialog.close();
    } else {
      editDialog.close();
    }
  };
  
  const baseHook = useTemplateDialogBase({
    dialogType: isEditMode ? 'create' : 'create', // Both use create logic
    initialData: data,
    onComplete: handleComplete,
    onClose: handleClose
  });
  
  return {
    ...baseHook,
    isOpen,
    isEditMode,
    dialogTitle: isEditMode 
      ? getMessage('editTemplate', undefined, 'Edit Template') 
      : getMessage('createTemplate', undefined, 'Create Template')
  };
}

/**
 * **NEW: Helper function to update metadata with new block IDs**
 */
function updateMetadataWithNewBlocks(
  metadata: PromptMetadata, 
  blockIdMap: Record<number, number>
): PromptMetadata {
  const updated = { ...metadata };
  
  // Update single metadata types
  const singleTypes = ['role', 'context', 'goal', 'audience', 'output_format', 'tone_style'];
  singleTypes.forEach(type => {
    const blockId = (metadata as any)[type];
    if (blockId && blockIdMap[blockId]) {
      (updated as any)[type] = blockIdMap[blockId];
    }
  });
  
  // Update multiple metadata types
  if (metadata.constraints) {
    updated.constraints = metadata.constraints.map(item => ({
      ...item,
      blockId: item.blockId && blockIdMap[item.blockId] ? blockIdMap[item.blockId] : item.blockId
    }));
  }
  
  if (metadata.examples) {
    updated.examples = metadata.examples.map(item => ({
      ...item,
      blockId: item.blockId && blockIdMap[item.blockId] ? blockIdMap[item.blockId] : item.blockId
    }));
  }
  
  return updated;
}