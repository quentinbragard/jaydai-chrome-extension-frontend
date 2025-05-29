import React, { useEffect, useState } from 'react';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { blocksApi } from '@/services/api/BlocksApi';
import { Block } from '@/types/prompts/blocks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyMessage } from '@/components/panels/TemplatesPanel/EmptyMessage';
import {
  getBlockTypeIcon,
  getBlockTypeColors,
  getBlockIconColors
} from '@/components/prompts/blocks/blockUtils';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { insertIntoPromptArea } from '@/utils/templates/placeholderUtils';

export const InsertBlockDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.INSERT_BLOCK);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const isDark = useThemeDetector();

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
        {loading ? (
          <LoadingSpinner size="sm" message="Loading blocks..." />
        ) : blocks.length === 0 ? (
          <EmptyMessage>No blocks available</EmptyMessage>
        ) : (
          blocks.map(block => {
            const Icon = getBlockTypeIcon(block.type);
            const cardColors = getBlockTypeColors(block.type, isDark);
            const iconBg = getBlockIconColors(block.type, isDark);
            const title =
              typeof block.title === 'string'
                ? block.title
                : block.title?.en || 'Untitled';
            return (
              <Card
                key={block.id}
                className={`jd-cursor-pointer ${cardColors} jd-border hover:jd-shadow-md`}
                onClick={() => useBlock(block)}
              >
                <CardContent className="jd-flex jd-items-center jd-gap-2 jd-p-2">
                  <span className={`jd-p-1 jd-rounded ${iconBg}`}><Icon className="jd-h-4 jd-w-4" /></span>
                  <span className="jd-text-sm jd-font-medium jd-truncate">{title}</span>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      <div className="jd-flex jd-justify-between jd-pt-4">
        <Button variant="outline" onClick={() => dialogProps.onOpenChange(false)}>Close</Button>
        <Button onClick={handleCreate}>Create Block</Button>
      </div>
    </BaseDialog>
  );
};
