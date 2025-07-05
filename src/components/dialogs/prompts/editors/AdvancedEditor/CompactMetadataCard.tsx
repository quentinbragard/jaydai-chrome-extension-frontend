import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Plus, ChevronDown, ChevronUp, X } from 'lucide-react';
import {
  MetadataType,
  MultipleMetadataType,
  SingleMetadataType,
  METADATA_CONFIGS,
  isMultipleMetadataType,
  MetadataItem
} from '@/types/prompts/metadata';
import { Block } from '@/types/prompts/blocks';
import { cn } from '@/core/utils/classNames';
import {
  getLocalizedContent,
  getBlockTypeColors,
  getBlockIconColors,
  getBlockTextColors,
  getBlockTypeIcon
} from '@/utils/prompts/blockUtils';
import { getMessage } from '@/core/utils/i18n';
import CompactMetadataItem from './CompactMetadataItem';

interface CompactMetadataCardProps {
  type: MetadataType;
  assigned: boolean;
  items: MetadataItem[];
  availableBlocks: Block[];
  expanded: boolean;
  isDarkMode: boolean;
  onToggleExpand: () => void;
  onSelect: (val: string) => void;
  onItemSelect: (id: string, val: string) => void;
  onAddItem: (val: string) => void;
  onRemoveItem: (id: string) => void;
  onRemove: () => void;
}

export const CompactMetadataCard: React.FC<CompactMetadataCardProps> = ({
  type,
  assigned,
  items,
  availableBlocks,
  expanded,
  isDarkMode,
  onToggleExpand,
  onSelect,
  onItemSelect,
  onAddItem,
  onRemoveItem,
  onRemove
}) => {
  const config = METADATA_CONFIGS[type];
  const Icon = getBlockTypeIcon(config.blockType);
  const cardColors = getBlockTypeColors(config.blockType, isDarkMode);
  const iconColors = getBlockIconColors(config.blockType, isDarkMode);
  const dotColor = getBlockTextColors(config.blockType, isDarkMode).replace('jd-text', 'jd-bg');

  return (
    <div className="jd-relative jd-group">
      <div
        className={cn(
          'jd-flex jd-flex-col jd-items-center jd-p-2 jd-rounded jd-border jd-transition-all jd-duration-200',
          'jd-hover:jd-shadow-sm jd-cursor-pointer jd-relative',
          assigned
            ? cardColors
            : isDarkMode
              ? 'jd-border-gray-600 jd-bg-gray-800/50 jd-text-gray-300'
              : 'jd-border-gray-300 jd-bg-gray-100 jd-text-gray-600'
        )}
      >
        <div
          className={cn(
            'jd-absolute jd-top-1 jd-right-1 jd-w-2 jd-h-2 jd-rounded-full',
            assigned ? dotColor : isDarkMode ? 'jd-bg-gray-500' : 'jd-bg-gray-400'
          )}
        />
        <div
          className={cn(
            'jd-p-1 jd-rounded jd-mb-1',
            assigned
              ? iconColors
              : isDarkMode
                ? 'jd-bg-gray-700 jd-text-gray-300'
                : 'jd-bg-gray-200 jd-text-gray-600'
          )}
        >
          <Icon className="jd-h-3 jd-w-3" />
        </div>
        <span className="jd-text-[10px] jd-font-medium jd-text-center jd-leading-tight jd-truncate jd-w-full">
          {config.label}
        </span>
        {assigned && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="jd-absolute jd-top-0 jd-left-0 jd-h-4 jd-w-4 jd-p-0 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity jd-bg-red-500 jd-text-white jd-rounded-full"
          >
            <X className="jd-h-2 jd-w-2" />
          </Button>
        )}
      </div>

      <div className="jd-mt-1 jd-space-y-1">
        {isMultipleMetadataType(type) ? (
          <>
            {items.length > 0 && !expanded ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleExpand}
                className="jd-w-full jd-h-6 jd-text-[10px] jd-px-2 jd-flex jd-items-center jd-justify-between"
              >
                <span>{items.length}</span>
                <ChevronDown className="jd-h-3 jd-w-3" />
              </Button>
            ) : (
              <>
                {items.length > 0 && (
                  <div className="jd-flex jd-justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onToggleExpand}
                      className="jd-h-4 jd-w-4 jd-p-0"
                    >
                      <ChevronUp className="jd-h-3 jd-w-3" />
                    </Button>
                  </div>
                )}
                {items.map(item => (
                  <CompactMetadataItem
                    key={item.id}
                    type={type as MultipleMetadataType}
                    item={item}
                    availableBlocks={availableBlocks}
                    onSelect={val => onItemSelect(item.id, val)}
                    onRemove={() => onRemoveItem(item.id)}
                  />
                ))}
                <Select onValueChange={onAddItem}>
                  <SelectTrigger className="jd-w-full jd-h-6 jd-text-[10px] jd-px-2 jd-border-dashed">
                    <SelectValue placeholder="+" />
                  </SelectTrigger>
                  <SelectContent className="jd-z-[10010]">
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
              </>
            )}
          </>
        ) : (
          <Select onValueChange={onSelect}>
            <SelectTrigger className="jd-w-full jd-h-6 jd-text-[10px] jd-px-2">
              <SelectValue placeholder={assigned ? '•' : '+'} />
            </SelectTrigger>
            <SelectContent className="jd-z-[10010]">
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
        )}
      </div>
    </div>
  );
};

export default CompactMetadataCard;
