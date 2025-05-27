// src/components/dialogs/templates/editor/EnhancedInteractivePreviewPanel.tsx
import React, { useEffect, useState } from 'react';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { PromptMetadata, METADATA_CONFIGS, MetadataType } from '@/components/templates/metadata/types';
import { blocksApi } from '@/services/api/BlocksApi';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Props {
  blocks: Block[];
  metadata: PromptMetadata;
  onAddBlock: (position: 'start' | 'end', blockType: BlockType, existingBlock?: Block) => void;
  onRemoveBlock: (blockId: number) => void;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onMoveBlock: (blockId: number, direction: 'up' | 'down') => void;
  onUpdateMetadata: (metadata: PromptMetadata) => void;
}

export const EnhancedInteractivePreviewPanel: React.FC<Props> = ({
  blocks,
  metadata,
  onUpdateBlock,
  onUpdateMetadata
}) => {
  const [availableBlocks, setAvailableBlocks] = useState<Record<MetadataType, Block[]>>({} as Record<MetadataType, Block[]>);
  const [customValues, setCustomValues] = useState<Record<MetadataType, string>>({} as Record<MetadataType, string>);

  useEffect(() => {
    const fetchBlocks = async () => {
      const result: Record<MetadataType, Block[]> = {} as any;
      await Promise.all(
        (Object.keys(METADATA_CONFIGS) as MetadataType[]).map(async (type) => {
          const res = await blocksApi.getBlocksByType(METADATA_CONFIGS[type].blockType);
          result[type] = res.success ? res.data : [];
        })
      );
      setAvailableBlocks(result);
    };
    fetchBlocks();
  }, []);

  const handleMetadataChange = (type: MetadataType, value: string) => {
    if (value === 'custom') {
      onUpdateMetadata({ ...metadata, [type]: 0 });
    } else {
      onUpdateMetadata({ ...metadata, [type]: Number(value) });
    }
  };

  const handleCustomChange = (type: MetadataType, value: string) => {
    setCustomValues((prev) => ({ ...prev, [type]: value }));
  };

  const getBlockContent = (blockId: number, type: MetadataType): string => {
    const block = availableBlocks[type]?.find((b) => b.id === blockId);
    if (!block) return '';
    if (typeof block.content === 'string') return block.content;
    const lang = getCurrentLanguage();
    return block.content[lang] || block.content.en || '';
  };

  const finalContent = [
    ...(Object.keys(METADATA_CONFIGS) as MetadataType[]).map((type) => {
      const id = metadata[type];
      const custom = customValues[type];
      if (id && id !== 0) return getBlockContent(id, type);
      if (custom) return custom;
      return '';
    }),
    ...blocks.map((b) => {
      if (typeof b.content === 'string') return b.content;
      const lang = getCurrentLanguage();
      return b.content[lang] || b.content.en || '';
    })
  ]
    .filter(Boolean)
    .join('\n\n');

  return (
    <div className="jd-space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prompt Settings</CardTitle>
        </CardHeader>
        <CardContent className="jd-space-y-4">
          {(Object.keys(METADATA_CONFIGS) as MetadataType[]).map((type) => {
            const config = METADATA_CONFIGS[type];
            const selected = metadata[type] ? String(metadata[type]) : '0';
            return (
              <div key={type} className="jd-space-y-2">
                <Label className="jd-text-sm jd-font-medium">{config.label}</Label>
                <Select value={selected} onValueChange={(v) => handleMetadataChange(type, v)}>
                  <SelectTrigger className="jd-w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    {availableBlocks[type]?.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {typeof b.content === 'string'
                          ? b.content.substring(0, 40)
                          : (b.content[getCurrentLanguage()] || '')}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom...</SelectItem>
                  </SelectContent>
                </Select>
                {(!metadata[type] || metadata[type] === 0) && (
                  <Textarea
                    value={customValues[type] || ''}
                    onChange={(e) => handleCustomChange(type, e.target.value)}
                    rows={2}
                  />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocks</CardTitle>
        </CardHeader>
        <CardContent className="jd-space-y-4">
          {blocks.map((block) => (
            <div key={block.id} className="jd-space-y-2">
              <Label className="jd-text-sm jd-font-medium capitalize">{block.type}</Label>
              <Textarea
                rows={4}
                value={typeof block.content === 'string' ? block.content : (block.content[getCurrentLanguage()] || '')}
                onChange={(e) => onUpdateBlock(block.id, { content: e.target.value })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="jd-whitespace-pre-wrap jd-text-sm">{finalContent}</pre>
        </CardContent>
      </Card>
    </div>
  );
};
