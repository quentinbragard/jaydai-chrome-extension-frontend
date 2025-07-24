// src/components/dialogs/prompts/editors/AdvancedEditor/components/CompactMetadataCard.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/core/utils/classNames';
import {
  MetadataType,
  SingleMetadataType,
  MultipleMetadataType,
  isMultipleMetadataType,
  METADATA_CONFIGS
} from '@/types/prompts/metadata';
import type { MetadataItem } from '@/types/prompts/metadata';
import { Block } from '@/types/prompts/blocks';
import { getBlockTypeIcon, getBlockIconColors, getBlockTextColors } from '@/utils/prompts/blockUtils';
import { X } from 'lucide-react';
import { SingleMetadataDropdown } from './SingleMetadataDropdown';
import { MultipleMetadataDropdown } from './MultipleMetadataDropdown';

interface CompactMetadataCardProps {
  type: MetadataType;
  assigned: boolean;
  isDarkMode: boolean;
  availableBlocks: Block[];
  selectedBlockId: number;
  items: MetadataItem[];
  onSelect: (val: string) => void;
  onAddItem: (val: string) => void;
  onRemoveItem: (id: string) => void;
  onRemove: () => void;
}

export const CompactMetadataCard: React.FC<CompactMetadataCardProps> = ({
  type,
  assigned,
  isDarkMode,
  availableBlocks,
  selectedBlockId,
  items,
  onSelect,
  onAddItem,
  onRemoveItem,
  onRemove
}) => {
  const config = METADATA_CONFIGS[type];
  const Icon = getBlockTypeIcon(config.blockType);

  // FIXED: Enhanced error handling for remove action
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      onRemove();
    } catch (error) {
      console.error(`Error removing metadata for type ${type}:`, error);
    }
  };

  // FIXED: Enhanced error handling for select action
  const handleSelect = (val: string) => {
    try {
      onSelect(val);
    } catch (error) {
      console.error(`Error selecting value ${val} for type ${type}:`, error);
    }
  };

  // FIXED: Enhanced error handling for add item action
  const handleAddItem = (val: string) => {
    try {
      onAddItem(val);
    } catch (error) {
      console.error(`Error adding item ${val} for type ${type}:`, error);
    }
  };

  // FIXED: Enhanced error handling for remove item action
  const handleRemoveItem = (id: string) => {
    try {
      onRemoveItem(id);
    } catch (error) {
      console.error(`Error removing item ${id} for type ${type}:`, error);
    }
  };

  return (
    <div className="jd-relative jd-group">
      <div
        className={cn(
          'jd-flex jd-flex-col jd-items-center jd-p-2 jd-rounded-lg jd-border jd-transition-all jd-duration-300',
          'jd-hover:jd-shadow-lg jd-cursor-pointer jd-relative jd-backdrop-blur-sm',
          assigned
            ? `jd-border-green-400 jd-bg-gradient-to-br jd-from-green-50 jd-to-green-100 ${isDarkMode ? 'jd-border-green-500 jd-from-green-900/30 jd-to-green-800/30' : ''}`
            : `jd-border-gray-300 jd-bg-gradient-to-br jd-from-gray-50 jd-to-gray-100 ${isDarkMode ? 'jd-border-gray-600 jd-from-gray-800/50 jd-to-gray-700/50' : ''} jd-hover:jd-border-primary/50 jd-hover:jd-from-primary/5 jd-hover:jd-to-primary/10`
        )}
      >
        <div
          className={cn(
            'jd-absolute jd-top-1.5 jd-right-1.5 jd-w-2 jd-h-2 jd-rounded-full jd-transition-all jd-duration-200',
            assigned
              ? `jd-bg-green-400 jd-shadow-lg`
              : `jd-bg-gray-400 ${isDarkMode ? 'jd-bg-gray-500' : ''}`
          )}
        />

        <div
          className={cn(
            'jd-p-1.5 jd-rounded-lg jd-mb-1.5 jd-transition-all jd-duration-200',
            assigned
              ? `${getBlockTextColors(config.blockType, isDarkMode)} ${getBlockIconColors(config.blockType, isDarkMode)}`
              : `jd-bg-gray-200 jd-text-gray-600 ${isDarkMode ? 'jd-bg-gray-700 jd-text-gray-300' : ''}`
          )}
        >
          <Icon className="jd-h-3 jd-w-3" />
        </div>

        <span className="jd-text-xs jd-font-medium jd-text-center jd-leading-tight jd-truncate jd-w-full jd-text-foreground">
          {config.label}
        </span>

        {assigned && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className={cn(
              'jd-absolute jd-top-0 jd-left-0 jd-p-0 jd-transition-all jd-duration-200',
              'jd-opacity-0 group-hover:jd-opacity-100 jd-text-foreground jd-rounded-full',
              'jd-shadow-lg hover:jd-shadow-red-500/50 hover:jd-bg-red-600 jd-transform jd-scale-90 hover:jd-scale-100'
            )}
          >
            <X className="jd-h-3 jd-w-3" />
          </Button>
        )}
      </div>

      <div className="jd-space-y-1">
        {isMultipleMetadataType(type) ? (
          <MultipleMetadataDropdown
            type={type as MultipleMetadataType}
            items={items}
            availableBlocks={availableBlocks}
            onRemove={handleRemoveItem}
            onAdd={handleAddItem}
            label={config.label}
          />
        ) : (
          <SingleMetadataDropdown
            type={type as SingleMetadataType}
            selectedBlockId={selectedBlockId}
            availableBlocks={availableBlocks}
            onSelect={handleSelect}
            label={config.label}
          />
        )}
      </div>
    </div>
  );
};