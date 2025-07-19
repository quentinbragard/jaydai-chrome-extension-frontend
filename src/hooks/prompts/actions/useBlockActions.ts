// src/hooks/prompts/actions/useBlockActions.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Block } from '@/types/prompts/blocks';
import { blocksApi } from '@/services/api/BlocksApi';
import { useDialogManager } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { getMessage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { useOnboardingChecklist } from '@/hooks/useOnboardingChecklist';

export interface UseBlockActionsProps {
  onBlockUpdated?: (block: Block) => void;
  onBlockDeleted?: (blockId: number) => void;
  onBlockCreated?: (block: Block) => void;
}

export function useBlockActions({ 
  onBlockUpdated, 
  onBlockDeleted, 
  onBlockCreated 
}: UseBlockActionsProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const { openDialog } = useDialogManager();
  const { markFirstBlockCreated } = useOnboardingChecklist();


  /**
   * Open edit dialog for a block
   */
  const editBlock = useCallback((block: Block) => {
    if (!block || !block.id) {
      toast.error(getMessage('invalidBlock', undefined, 'Invalid block data'));
      return;
    }

    // Extract content for editing (handle both string and localized content)
    const content = typeof block.content === 'string' 
      ? block.content 
      : block.content?.en || '';
    
    const title = typeof block.title === 'string' 
      ? block.title 
      : block.title?.en || '';

    const description = typeof block.description === 'string' 
      ? block.description 
      : block.description?.en || '';

    openDialog(DIALOG_TYPES.CREATE_BLOCK, {
      isEdit: true,
      block,
      initialType: block.type || 'custom',
      initialTitle: title,
      initialContent: content,
      initialDescription: description,
      onBlockCreated: async (updatedData: any) => {
        try {
          setIsLoading(true);
          
          const updatePayload = {
            title: updatedData.title,
            content: updatedData.content,
            description: updatedData.description,
            published: updatedData.published ?? true
          };

          const response = await blocksApi.updateBlock(block.id, updatePayload);
          
          if (response.success && response.data) {
            toast.success(getMessage('blockUpdated', undefined, 'Block updated successfully'));
            trackEvent(EVENTS.BLOCK_UPDATED, { block_id: response.data.id, block_type: response.data.type });
            if (onBlockUpdated) {
              onBlockUpdated(response.data);
            }
            return true; // Success - close dialog
          } else {
            toast.error(response.message || getMessage('blockUpdateFailed', undefined, 'Failed to update block'));
            return false; // Keep dialog open
          }
        } catch (error) {
          console.error('Error updating block:', error);
          toast.error(getMessage('blockUpdateError', undefined, 'An error occurred while updating the block'));
          return false;
        } finally {
          setIsLoading(false);
        }
      }
    });
  }, [openDialog, onBlockUpdated]);

  /**
   * Delete a block with confirmation
   */
  const deleteBlock = useCallback((block: Block) => {
    if (!block || !block.id) {
      toast.error(getMessage('invalidBlock', undefined, 'Invalid block data'));
      return;
    }

    const title = typeof block.title === 'string' 
      ? block.title 
      : block.title?.en || 'Untitled Block';

    openDialog(DIALOG_TYPES.CONFIRMATION, {
      title: getMessage('deleteBlock', undefined, 'Delete Block'),
      description: getMessage(
        'deleteBlockConfirmation', 
        [title], 
        `Are you sure you want to delete "${title}"? This action cannot be undone.`
      ),
      confirmText: getMessage('delete', undefined, 'Delete'),
      cancelText: getMessage('cancel', undefined, 'Cancel'),
      variant: 'destructive',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          
          const response = await blocksApi.deleteBlock(block.id);
          
          if (response.success) {
            toast.success(getMessage('blockDeleted', undefined, 'Block deleted successfully'));
            trackEvent(EVENTS.BLOCK_DELETED, { block_id: block.id, block_type: block.type });
            if (onBlockDeleted) {
              onBlockDeleted(block.id);
            }
            return true; // Success - close dialog
          } else {
            toast.error(response.message || getMessage('blockDeleteFailed', undefined, 'Failed to delete block'));
            return false; // Keep dialog open
          }
        } catch (error) {
          console.error('Error deleting block:', error);
          toast.error(getMessage('blockDeleteError', undefined, 'An error occurred while deleting the block'));
          return false;
        } finally {
          setIsLoading(false);
        }
      }
    });
  }, [openDialog, onBlockDeleted]);

  /**
   * Create a new block
   */
  const createBlock = useCallback((initialData?: Partial<Block>, source: string = 'CreateBlockDialog') => {
    openDialog(DIALOG_TYPES.CREATE_BLOCK, {
      isEdit: false,
      initialType: initialData?.type || 'custom',
      initialTitle: initialData?.title || '',
      initialContent: initialData?.content || '',
      initialDescription: initialData?.description || '',
      source,
      onBlockCreated: async (blockData: any) => {
        try {
          setIsLoading(true);
          
          const createPayload = {
            title: blockData.title,
            content: blockData.content,
            type: blockData.type,
            description: blockData.description,
            published: blockData.published ?? true
          };

          const response = await blocksApi.createBlock(createPayload);
          
          if (response.success && response.data) {
            toast.success(getMessage('blockCreated', undefined, 'Block created successfully'));
            trackEvent(EVENTS.BLOCK_CREATED, {
              block_id: response.data.id,
              block_type: response.data.type,
              source
            });
            await markFirstBlockCreated();
            if (onBlockCreated) {
              onBlockCreated(response.data);
            }
            return true; // Success - close dialog
          } else {
            if (response.message && response.message.includes('Subscription')) {
              openDialog(DIALOG_TYPES.PAYWALL);
            }
            toast.error(response.message || getMessage('blockCreateFailed', undefined, 'Failed to create block'));
            return false; // Keep dialog open
          }
        } catch (error) {
          console.error('Error creating block:', error);
          if (error instanceof Error && error.message.includes('Subscription')) {
            openDialog(DIALOG_TYPES.PAYWALL);
          }
          toast.error(getMessage('blockCreateError', undefined, 'An error occurred while creating the block'));
          return false;
        } finally {
          setIsLoading(false);
        }
      }
    });
  }, [openDialog, onBlockCreated, markFirstBlockCreated]);

  /**
   * Duplicate a block
   */
  const duplicateBlock = useCallback((block: Block) => {
    if (!block || !block.id) {
      toast.error(getMessage('invalidBlock', undefined, 'Invalid block data'));
      return;
    }

    const title = typeof block.title === 'string' 
      ? block.title 
      : block.title?.en || 'Untitled Block';

    createBlock({
      ...block,
      title: `${title} (Copy)`,
      id: undefined // Remove ID so it creates a new block
    });
  }, [createBlock]);

  return {
    isLoading,
    editBlock,
    deleteBlock,
    createBlock,
    duplicateBlock
  };
}