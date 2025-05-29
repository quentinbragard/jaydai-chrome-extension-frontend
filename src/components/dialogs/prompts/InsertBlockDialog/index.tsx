import React, { useEffect, useState } from 'react';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { blocksApi } from '@/services/api/BlocksApi';
import { Block } from '@/types/prompts/blocks';
import { Button } from '@/components/ui/button';
import { insertIntoPromptArea } from '@/utils/templates/placeholderUtils';

export const InsertBlockDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.INSERT_BLOCK);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      blocksApi.getBlocks().then(res => {
        if (res.success) {
          setBlocks(res.data);
        } else {
          setBlocks([]);
        }
        setLoading(false);
      });
    }
  }, [isOpen]);

  const useBlock = (block: Block) => {
    const content = typeof block.content === 'string'
      ? block.content
      : block.content.en || '';
    insertIntoPromptArea(content);
    dialogProps.onOpenChange(false);
  };

  const handleCreate = () => {
    window.dialogManager?.openDialog(DIALOG_TYPES.CREATE_BLOCK, {
      onBlockCreated: (b: Block) => useBlock(b)
    });
  };

  if (!isOpen) return null;

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title="Insert Block"
      className="jd-max-w-md"
    >
      <div className="jd-flex jd-flex-col jd-gap-2 jd-max-h-72 jd-overflow-y-auto">
        {loading && <div>Loading...</div>}
        {blocks.map(block => (
          <Button
            key={block.id}
            variant="ghost"
            className="jd-justify-start jd-whitespace-normal jd-text-left"
            onClick={() => useBlock(block)}
          >
            {(typeof block.title === 'string' ? block.title : block.title?.en) || 'Untitled'}
          </Button>
        ))}
      </div>
      <div className="jd-flex jd-justify-between jd-pt-4">
        <Button variant="outline" onClick={() => dialogProps.onOpenChange(false)}>Close</Button>
        <Button onClick={handleCreate}>Create Block</Button>
      </div>
    </BaseDialog>
  );
};
