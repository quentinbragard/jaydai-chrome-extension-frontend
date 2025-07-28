import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Save } from 'lucide-react';
import { CreateBlockData, blocksApi } from '@/services/api/BlocksApi';
import { Block, BlockType } from '@/types/prompts/blocks';
import { toast } from 'sonner';
import { useDialogManager } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';

interface SaveBlockButtonProps {
  type: BlockType;
  content: string;
  title?: string;
  description?: string;
  onSaved?: (block: Block) => void;
  className?: string;
  /**
   * When true, only display the icon instead of text. Used in compact areas
   * like metadata cards.
   */
  iconOnly?: boolean;

}

export const SaveBlockButton: React.FC<SaveBlockButtonProps> = ({
  type,
  content,
  title,
  description,
  onSaved,
  className,
  iconOnly = false


}) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { openDialog } = useDialogManager();

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    const data: CreateBlockData = {
      type,
      content: content,
      title: title,
      description: description
    } as any;
    try {
      const res = await blocksApi.createBlock(data);
      if (res.success) {
        toast.success('Block saved');
        setSaved(true);
        onSaved && onSaved(res.data);
      } else {
        if (
          res.message &&
          (res.message.includes('Subscription') || res.message.includes('402'))
        ) {
          openDialog(DIALOG_TYPES.PAYWALL, { reason: 'blockLimit' });
        }
        toast.error(res.message || 'Failed to save block');
      }
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes('Subscription') || err.message.includes('402'))
      ) {
        openDialog(DIALOG_TYPES.PAYWALL, { reason: 'blockLimit' });
      }
      toast.error('Failed to save block');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={iconOnly ? 'ghost' : 'secondary'}

      onClick={handleSave}
      disabled={saving || saved || !content.trim()}
      className={className}
      title="Save block"
    >
      {saved ? (
        <>
          <Check className="jd-h-4 jd-w-4 jd-mr-1" />
          {!iconOnly && <span>Saved</span>}
        </>
      ) : (
        <>
          <Save className="jd-h-4 jd-w-4 jd-mr-1" />
          {!iconOnly && <span>Save Block</span>}
        </>
      )}

    </Button>
  );
};
