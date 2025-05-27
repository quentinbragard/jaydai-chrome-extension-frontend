import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Save } from 'lucide-react';
import { CreateBlockData, blocksApi } from '@/services/api/BlocksApi';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { toast } from 'sonner';

interface SaveBlockButtonProps {
  type: BlockType;
  content: string;
  title?: string;
  description?: string;
  onSaved?: (block: Block) => void;
  className?: string;
}

export const SaveBlockButton: React.FC<SaveBlockButtonProps> = ({
  type,
  content,
  title,
  description,
  onSaved,
  className
}) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    const data: CreateBlockData = {
      type,
      content: typeof content === 'string' ? { en: content } : content,
      title: title ? { en: title } : undefined,
      description: description ? { en: description } : undefined
    } as any;
    try {
      const res = await blocksApi.createBlock(data);
      if (res.success) {
        toast.success('Block saved');
        setSaved(true);
        onSaved && onSaved(res.data);
      } else {
        toast.error(res.message || 'Failed to save block');
      }
    } catch (err) {
      toast.error('Failed to save block');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleSave}
      disabled={saving || saved || !content.trim()}
      className={className}
      title="Save block"
    >
      {saved ? <Check className="jd-h-4 jd-w-4" /> : <Save className="jd-h-4 jd-w-4" />}
    </Button>
  );
};
