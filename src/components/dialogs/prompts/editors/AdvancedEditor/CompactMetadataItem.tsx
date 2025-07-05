import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import {
  MultipleMetadataType,
  MetadataItem,
  METADATA_CONFIGS
} from '@/types/prompts/metadata';
import { Block } from '@/types/prompts/blocks';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';
import { getMessage } from '@/core/utils/i18n';

interface CompactMetadataItemProps {
  type: MultipleMetadataType;
  item: MetadataItem;
  availableBlocks: Block[];
  onSelect: (val: string) => void;
  onRemove: () => void;
}

export const CompactMetadataItem: React.FC<CompactMetadataItemProps> = ({
  type,
  item,
  availableBlocks,
  onSelect,
  onRemove
}) => {
  const config = METADATA_CONFIGS[type];

  return (
    <div className="jd-flex jd-items-center jd-gap-1">
      <Select value={item.blockId ? String(item.blockId) : '0'} onValueChange={onSelect}>
        <SelectTrigger className="jd-w-full jd-h-6 jd-text-[10px] jd-px-2">
          <SelectValue placeholder={getMessage('select', undefined, 'Select')} />
        </SelectTrigger>
        <SelectContent className="jd-z-[10010]">
          <SelectItem value="0">{getMessage('none', undefined, 'None')}</SelectItem>
          {availableBlocks.map(block => (
            <SelectItem key={block.id} value={String(block.id)}>
              <span className="jd-text-xs">
                {getLocalizedContent(block.title) || `${config.label} block`}
              </span>
            </SelectItem>
          ))}
          <SelectItem value="create">
            <div className="jd-flex jd-items-center jd-gap-2">
              <Plus className="jd-h-3 jd-w-3" />
              <span className="jd-text-xs">
                {getMessage(
                  'createTypeBlock',
                  [config.label.toLowerCase()],
                  `Create ${config.label.toLowerCase()} block`
                )}
              </span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="jd-h-4 jd-w-4 jd-p-0"
      >
        <X className="jd-h-2 jd-w-2" />
      </Button>
    </div>
  );
};

export default CompactMetadataItem;
