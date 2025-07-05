// src/components/dialogs/prompts/editors/AdvancedEditor/CompactMetadataSection.tsx
import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Plus, Check, X } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { getMessage } from '@/core/utils/i18n';

import {
  MetadataType,
  PRIMARY_METADATA,
  SECONDARY_METADATA,
  METADATA_CONFIGS,
  isMultipleMetadataType,
  SingleMetadataType,
  MultipleMetadataType
} from '@/types/prompts/metadata';
import type { MetadataItem } from '@/types/prompts/metadata';
import { Block } from '@/types/prompts/blocks';
import { useTemplateEditor } from '../../TemplateEditorDialog/TemplateEditorContext';
import {
  updateSingleMetadata,
  addMetadataItem,
  removeMetadataItem,
  updateMetadataItem,
  addSecondaryMetadata,
  removeSecondaryMetadata
} from '@/utils/prompts/metadataUtils';
import { useDialogManager } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import {
  getLocalizedContent,
  getBlockTypeIcon,
  getBlockIconColors
} from '@/utils/prompts/blockUtils';

const METADATA_ICONS: Record<MetadataType, React.ComponentType<any>> = {
  role: getBlockTypeIcon('role'),
  context: getBlockTypeIcon('context'),
  goal: getBlockTypeIcon('goal'),
  audience: getBlockTypeIcon('audience'),
  output_format: getBlockTypeIcon('output_format'),
  example: getBlockTypeIcon('example'),
  tone_style: getBlockTypeIcon('tone_style'),
  constraint: getBlockTypeIcon('constraint')
};

const CARD_HEIGHT = 24;
const COLLAPSED_OFFSET = 6;
const EXPANDED_OFFSET = 28;

interface StackedItemsProps {
  type: MultipleMetadataType;
  items: MetadataItem[];
  availableBlocks: Block[];
  onSelect: (id: string, val: string) => void;
  onRemove: (id: string) => void;
  onAdd: (val: string) => void;
  label: string;
}

const StackedItems: React.FC<StackedItemsProps> = ({
  type,
  items,
  availableBlocks,
  onSelect,
  onRemove,
  onAdd,
  label
}) => {
  const [hover, setHover] = useState(false);

  const containerHeight = hover
    ? (items.length + 1) * EXPANDED_OFFSET
    : CARD_HEIGHT + COLLAPSED_OFFSET * (items.length - 1);

  return (
    <div
      className="jd-relative jd-mt-1 jd-transition-all jd-duration-300"
      style={{ height: containerHeight }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className="jd-flex jd-items-center jd-gap-1 jd-absolute jd-w-full jd-transition-all jd-duration-300"
          style={{
            transform: `translateY(${
              hover ? index * EXPANDED_OFFSET : -index * COLLAPSED_OFFSET
            }px)`
          }}
        >
          <Select
            value={item.blockId ? String(item.blockId) : '0'}
            onValueChange={val => onSelect(item.id, val)}
          >
            <SelectTrigger className="jd-w-full jd-h-6 jd-text-[10px] jd-px-2">
              <SelectValue placeholder={getMessage('select', undefined, 'Select')} />
            </SelectTrigger>
            <SelectContent className="jd-z-[10010]">
              <SelectItem value="0">
                {getMessage('none', undefined, 'None')}
              </SelectItem>
              {availableBlocks.map(block => (
                <SelectItem key={block.id} value={String(block.id)}>
                  <span className="jd-text-xs">
                    {getLocalizedContent(block.title) || `${label} block`}
                  </span>
                </SelectItem>
              ))}
              <SelectItem value="create">
                <div className="jd-flex jd-items-center jd-gap-2">
                  <Plus className="jd-h-3 jd-w-3" />
                  <span className="jd-text-xs">
                    {getMessage(
                      'createTypeBlock',
                      [label.toLowerCase()],
                      `Create ${label.toLowerCase()} block`
                    )}
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="jd-h-4 jd-w-4 jd-p-0"
          >
            <X className="jd-h-2 jd-w-2" />
          </Button>
        </div>
      ))}

      <div
        className="jd-absolute jd-w-full jd-transition-all jd-duration-300"
        style={{
          transform: `translateY(${
            hover ? items.length * EXPANDED_OFFSET : -items.length * COLLAPSED_OFFSET
          }px)`
        }}
      >
        <Select onValueChange={val => onAdd(val)}>
          <SelectTrigger className="jd-w-full jd-h-6 jd-text-[10px] jd-px-2 jd-border-dashed">
            <SelectValue placeholder="+" />
          </SelectTrigger>
          <SelectContent className="jd-z-[10010]">
            {availableBlocks.map(block => (
              <SelectItem key={block.id} value={String(block.id)}>
                <span className="jd-text-xs">
                  {getLocalizedContent(block.title) || `${label} block`}
                </span>
              </SelectItem>
            ))}
            <SelectItem value="create">
              <div className="jd-flex jd-items-center jd-gap-2">
                <Plus className="jd-h-3 jd-w-3" />
                <span className="jd-text-xs">
                  {getMessage(
                    'createTypeBlock',
                    [label.toLowerCase()],
                    `Create ${label.toLowerCase()} block`
                  )}
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

interface CompactMetadataProps {
  availableMetadataBlocks: Record<MetadataType, Block[]>;
}

export const CompactMetadataSection: React.FC<CompactMetadataProps> = ({
  availableMetadataBlocks
}) => {
  const {
    metadata,
    setMetadata,
    addNewBlock
  } = useTemplateEditor();

  const isDarkMode = useThemeDetector();
  const { openDialog } = useDialogManager();

  // All metadata types combined
  const allMetadataTypes = [...PRIMARY_METADATA, ...SECONDARY_METADATA];

  // Check if a metadata type has a value assigned
  const isAssigned = useCallback((type: MetadataType): boolean => {
    if (isMultipleMetadataType(type)) {
      const items = (metadata as any)[type as MultipleMetadataType] || [];
      return items.length > 0;
    } else {
      const value = (metadata as any)[type as SingleMetadataType];
      const customValue = metadata.values?.[type as SingleMetadataType];
      return (value && value !== 0) || (customValue && customValue.trim() !== '');
    }
  }, [metadata]);

  // Handle single metadata selection
  const handleSelect = useCallback((type: MetadataType, val: string) => {
    if (val === 'create') {
      const config = METADATA_CONFIGS[type];
      openDialog(DIALOG_TYPES.CREATE_BLOCK, {
        initialType: config.blockType,
        onBlockCreated: (b: Block) => {
          addNewBlock(b);
          if (isMultipleMetadataType(type)) {
            setMetadata(prev =>
              addMetadataItem(prev, type as MultipleMetadataType, {
                blockId: b.id,
                value: getLocalizedContent(b.content)
              })
            );
          } else {
            setMetadata(prev =>
              updateSingleMetadata(prev, type as SingleMetadataType, b.id)
            );
          }
        }
      });
      return;
    }

    if (isMultipleMetadataType(type)) {
      const blockId = parseInt(val, 10);
      const block = availableMetadataBlocks[type]?.find(b => b.id === blockId);
      setMetadata(prev =>
        addMetadataItem(prev, type as MultipleMetadataType, {
          blockId: isNaN(blockId) ? undefined : blockId,
          value: block ? getLocalizedContent(block.content) : ''
        })
      );
    } else {
      const blockId = parseInt(val, 10);
      setMetadata(prev =>
        updateSingleMetadata(
          prev,
          type as SingleMetadataType,
          isNaN(blockId) ? 0 : blockId
        )
      );
    }
  }, [availableMetadataBlocks, setMetadata, addNewBlock, openDialog]);

  const handleItemSelect = useCallback(
    (type: MultipleMetadataType, id: string, val: string) => {
      if (val === 'create') {
        const config = METADATA_CONFIGS[type];
        openDialog(DIALOG_TYPES.CREATE_BLOCK, {
          initialType: config.blockType,
          onBlockCreated: b => {
            addNewBlock(b);
            setMetadata(prev =>
              updateMetadataItem(prev, type, id, {
                blockId: b.id,
                value: getLocalizedContent(b.content)
              })
            );
          }
        });
        return;
      }

      const blockId = parseInt(val, 10);
      const block = availableMetadataBlocks[type]?.find(b => b.id === blockId);
      setMetadata(prev =>
        updateMetadataItem(prev, type, id, {
          blockId: isNaN(blockId) ? 0 : blockId,
          value: block ? getLocalizedContent(block.content) : ''
        })
      );
    },
    [availableMetadataBlocks, setMetadata, addNewBlock, openDialog]
  );

  const handleAddItem = useCallback(
    (type: MultipleMetadataType, val: string) => {
      if (val === 'create') {
        const config = METADATA_CONFIGS[type];
        openDialog(DIALOG_TYPES.CREATE_BLOCK, {
          initialType: config.blockType,
          onBlockCreated: b => {
            addNewBlock(b);
            setMetadata(prev =>
              addMetadataItem(prev, type, {
                blockId: b.id,
                value: getLocalizedContent(b.content)
              })
            );
          }
        });
        return;
      }

      const blockId = parseInt(val, 10);
      const block = availableMetadataBlocks[type]?.find(b => b.id === blockId);
      setMetadata(prev =>
        addMetadataItem(prev, type, {
          blockId: isNaN(blockId) ? undefined : blockId,
          value: block ? getLocalizedContent(block.content) : ''
        })
      );
    },
    [availableMetadataBlocks, setMetadata, addNewBlock, openDialog]
  );

  const handleRemoveItem = useCallback(
    (type: MultipleMetadataType, id: string) => {
      setMetadata(prev => removeMetadataItem(prev, type, id));
    },
    [setMetadata]
  );

  // Handle removing metadata
  const handleRemove = useCallback((type: MetadataType) => {
    if (isMultipleMetadataType(type)) {
      setMetadata(prev => ({
        ...prev,
        [type]: []
      }));
    } else {
      setMetadata(prev => {
        const newMetadata = { ...prev };
        (newMetadata as any)[type] = 0;
        if (newMetadata.values) {
          newMetadata.values = {
            ...newMetadata.values,
            [type]: ''
          };
        }
        return newMetadata;
      });
    }
  }, [setMetadata]);

  return (
    <div className="jd-space-y-4">
      <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
        <span className="jd-w-2 jd-h-6 jd-bg-gradient-to-b jd-from-green-500 jd-to-teal-600 jd-rounded-full"></span>
        {getMessage('promptMetadata', undefined, 'Prompt Metadata')}
      </h3>

      {/* Ultra-compact metadata grid */}
      <div className="jd-grid jd-grid-cols-8 jd-gap-2">
        {allMetadataTypes.map(type => {
          const config = METADATA_CONFIGS[type];
          const Icon = METADATA_ICONS[type];
          const assigned = isAssigned(type);
          const availableBlocks = availableMetadataBlocks[type] || [];
          const items = isMultipleMetadataType(type)
            ? ((metadata as any)[type as MultipleMetadataType] || [])
            : [];

          return (
            <div key={type} className="jd-relative jd-group">
              {/* Ultra-compact metadata card */}
              <div className={cn(
                'jd-flex jd-flex-col jd-items-center jd-p-2 jd-rounded jd-border jd-transition-all jd-duration-200',
                'jd-hover:jd-shadow-sm jd-cursor-pointer jd-relative',
                assigned
                  ? 'jd-border-green-400 jd-bg-green-100 jd-dark:jd-border-green-500 jd-dark:jd-bg-green-900/30'
                  : 'jd-border-gray-300 jd-bg-gray-100 jd-dark:jd-border-gray-600 jd-dark:jd-bg-gray-800/50 jd-hover:jd-border-primary/50'
              )}>
                {/* Status dot */}
                <div className={cn(
                  'jd-absolute jd-top-1 jd-right-1 jd-w-2 jd-h-2 jd-rounded-full',
                  assigned ? 'jd-bg-green-500' : 'jd-bg-gray-400'
                )} />

                {/* Icon */}
                <div className={cn(
                  'jd-p-1 jd-rounded jd-mb-1',
                  assigned 
                    ? 'jd-bg-green-200 jd-text-green-800 jd-dark:jd-bg-green-800 jd-dark:jd-text-green-200' 
                    : 'jd-bg-gray-200 jd-text-gray-600 jd-dark:jd-bg-gray-700 jd-dark:jd-text-gray-300'
                )}>
                  <Icon className="jd-h-3 jd-w-3" />
                </div>

                {/* Label */}
                <span className="jd-text-[10px] jd-font-medium jd-text-center jd-leading-tight jd-truncate jd-w-full">
                  {config.label}
                </span>

                {/* Remove button (only when assigned) */}
                {assigned && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(type);
                    }}
                    className="jd-absolute jd-top-0 jd-left-0 jd-h-4 jd-w-4 jd-p-0 jd-opacity-0 group-hover:jd-opacity-100 jd-transition-opacity jd-bg-red-500 jd-text-white jd-rounded-full"
                  >
                    <X className="jd-h-2 jd-w-2" />
                  </Button>
                )}
              </div>

              {/* Ultra-compact select dropdown */}
              <div className="jd-mt-1 jd-space-y-1">
                {isMultipleMetadataType(type) ? (
                  <StackedItems
                    type={type as MultipleMetadataType}
                    items={items}
                    availableBlocks={availableBlocks}
                    onSelect={(id, val) =>
                      handleItemSelect(type as MultipleMetadataType, id, val)
                    }
                    onRemove={id =>
                      handleRemoveItem(type as MultipleMetadataType, id)
                    }
                    onAdd={val => handleAddItem(type as MultipleMetadataType, val)}
                    label={config.label}
                  />
                ) : (
                  <Select onValueChange={val => handleSelect(type, val)}>
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
        })}
      </div>
    </div>
  );
};