// src/components/dialogs/prompts/editors/AdvancedEditor/CompactMetadataSection.tsx
import React, { useCallback, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Plus, Check, X, ChevronDown, Trash2, ArrowLeft } from 'lucide-react';
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

// New dropdown component for single metadata items
interface SingleMetadataDropdownProps {
  type: SingleMetadataType;
  selectedBlockId: number;
  availableBlocks: Block[];
  onSelect: (val: string) => void;
  label: string;
}

const SingleMetadataDropdown: React.FC<SingleMetadataDropdownProps> = ({
  type,
  selectedBlockId,
  availableBlocks,
  onSelect,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDarkMode = useThemeDetector();

  const selectedBlock = selectedBlockId && selectedBlockId !== 0 
    ? availableBlocks.find(b => b.id === selectedBlockId) 
    : null;

  const handleSelectBlock = (blockId: string) => {
    onSelect(blockId);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'jd-w-full jd-h-6 jd-text-xs jd-px-2 jd-mt-1 jd-justify-between',
            'jd-border-dashed jd-border-gray-300 jd-dark:jd-border-gray-600',
            'hover:jd-border-primary/50 hover:jd-bg-primary/5 jd-dark:hover:jd-bg-primary/10'
          )}
        >
          <div className="jd-flex jd-items-center jd-gap-1 jd-flex-1 jd-min-w-0">
            {selectedBlock ? (
              <span className="jd-truncate">
                {getLocalizedContent(selectedBlock.title) || `${label} block`}
              </span>
            ) : (
              <>
                <Plus className="jd-h-3 jd-w-3 jd-flex-shrink-0" />
                <span className="jd-truncate">Add {label.toLowerCase()}</span>
              </>
            )}
          </div>
          <ChevronDown className="jd-h-3 jd-w-3 jd-flex-shrink-0 jd-ml-1" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="jd-w-80 jd-z-[10020] jd-p-0"
      >
        {/* Header */}
        <div className="jd-flex jd-items-center jd-justify-between jd-p-3 jd-border-b jd-border-border/50">
          <div className="jd-text-sm jd-font-medium">
            Select {label.toLowerCase()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground hover:jd-text-foreground"
          >
            <X className="jd-h-3 jd-w-3" />
          </Button>
        </div>

        {/* Current selection (if any) */}
        {selectedBlock && (
          <>
            <div className="jd-p-3 jd-bg-muted/30">
              <div className="jd-text-xs jd-font-medium jd-text-muted-foreground jd-mb-2">
                Current selection
              </div>
              <div className="jd-flex jd-items-center jd-justify-between jd-p-2 jd-bg-background jd-rounded jd-border">
                <div className="jd-flex-1 jd-min-w-0">
                  <div className="jd-text-sm jd-font-medium jd-truncate">
                    {getLocalizedContent(selectedBlock.title) || `${label} block`}
                  </div>
                  <div className="jd-text-xs jd-text-muted-foreground jd-truncate jd-mt-1">
                    {(() => {
                      const content = getLocalizedContent(selectedBlock.content);
                      return content.length > 50 ? `${content.substring(0, 50)}...` : content;
                    })()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectBlock('0')}
                  className="jd-ml-2 jd-h-7 jd-w-7 jd-p-0 jd-text-muted-foreground hover:jd-text-destructive jd-flex-shrink-0"
                  title={`Remove ${label.toLowerCase()}`}
                >
                  <Trash2 className="jd-h-3 jd-w-3" />
                </Button>
              </div>
            </div>
            <div className="jd-px-3 jd-py-2 jd-border-b jd-border-border/50">
              <div className="jd-text-xs jd-font-medium jd-text-muted-foreground">
                Or choose a different {label.toLowerCase()}
              </div>
            </div>
          </>
        )}

        {/* Available blocks list */}
        <div className="jd-max-h-60 jd-overflow-y-auto">
          {availableBlocks.length === 0 ? (
            <div className="jd-p-4 jd-text-center jd-text-sm jd-text-muted-foreground">
              No {label.toLowerCase()}s available
            </div>
          ) : (
            availableBlocks
              .filter(block => !selectedBlock || block.id !== selectedBlock.id) // Hide currently selected block
              .map((block) => (
                <div 
                  key={block.id} 
                  className="jd-flex jd-items-center jd-justify-between jd-p-3 jd-border-b jd-border-border/30 last:jd-border-b-0 hover:jd-bg-muted/50 jd-cursor-pointer"
                  onClick={() => handleSelectBlock(String(block.id))}
                >
                  <div className="jd-flex-1 jd-min-w-0">
                    <div className="jd-text-sm jd-font-medium jd-truncate">
                      {getLocalizedContent(block.title) || `${label} block`}
                    </div>
                    <div className="jd-text-xs jd-text-muted-foreground jd-truncate jd-mt-1">
                      {(() => {
                        const content = getLocalizedContent(block.content);
                        return content.length > 50 ? `${content.substring(0, 50)}...` : content;
                      })()}
                    </div>
                  </div>
                  {selectedBlock && selectedBlock.id === block.id ? (
                    <Check className="jd-h-4 jd-w-4 jd-text-green-500 jd-ml-2 jd-flex-shrink-0" />
                  ) : (
                    <Plus className="jd-h-4 jd-w-4 jd-text-muted-foreground jd-ml-2 jd-flex-shrink-0" />
                  )}
                </div>
              ))
          )}
        </div>

        {/* Create new block option */}
        <div className="jd-p-3 jd-border-t jd-border-border/50">
          <div 
            className="jd-flex jd-items-center jd-gap-2 jd-p-2 jd-rounded jd-border jd-border-dashed jd-border-muted-foreground/50 hover:jd-border-primary/50 hover:jd-bg-primary/5 jd-cursor-pointer jd-transition-colors"
            onClick={() => handleSelectBlock('create')}
          >
            <Plus className="jd-h-4 jd-w-4 jd-text-muted-foreground" />
            <span className="jd-text-sm jd-text-muted-foreground">
              {getMessage(
                'createTypeBlock',
                [label.toLowerCase()],
                `Create new ${label.toLowerCase()} block`
              )}
            </span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// New dropdown component for multiple metadata items with navigation
interface MultipleMetadataDropdownProps {
  type: MultipleMetadataType;
  items: MetadataItem[];
  availableBlocks: Block[];
  onRemove: (id: string) => void;
  onAdd: (val: string) => void;
  label: string;
}

const MultipleMetadataDropdown: React.FC<MultipleMetadataDropdownProps> = ({
  type,
  items,
  availableBlocks,
  onRemove,
  onAdd,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'selected' | 'available'>('selected');
  const isDarkMode = useThemeDetector();

  // Get block name for display
  const getBlockName = (item: MetadataItem) => {
    if (!item.blockId) return `Empty ${label}`;
    const block = availableBlocks.find(b => b.id === item.blockId);
    return getLocalizedContent(block?.title) || `${label} block`;
  };

  const handleItemRemove = (itemId: string) => {
    onRemove(itemId);
  };

  const handleAddBlock = (blockId: string) => {
    onAdd(blockId);
    // Stay in available view so user can add more blocks
  };

  const handleClose = () => {
    setIsOpen(false);
    setView('selected'); // Reset to selected view when closing
  };

  const handleGoToAvailable = () => {
    setView('available');
  };

  const handleBackToSelected = () => {
    setView('selected');
  };

  // Filter available blocks to exclude already selected ones
  const availableBlocksFiltered = availableBlocks.filter(block => 
    !items.some(item => item.blockId === block.id)
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'jd-w-full jd-h-6 jd-text-xs jd-px-2 jd-mt-1 jd-justify-between',
            'jd-border-dashed jd-border-gray-300 jd-dark:jd-border-gray-600',
            'hover:jd-border-primary/50 hover:jd-bg-primary/5 jd-dark:hover:jd-bg-primary/10'
          )}
        >
          <div className="jd-flex jd-items-center jd-gap-1">
            {items.length > 0 ? (
              <>
                <span className="jd-font-medium">{items.length}</span>
                <span className="jd-text-muted-foreground">{label.toLowerCase()}{items.length > 1 ? 's' : ''}</span>
              </>
            ) : (
              <>
                <Plus className="jd-h-3 jd-w-3" />
                <span>Add {label.toLowerCase()}</span>
              </>
            )}
          </div>
          <ChevronDown className="jd-h-3 jd-w-3 jd-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="jd-w-80 jd-z-[10020] jd-p-0"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          setView('selected');
        }}
      >
        {view === 'selected' ? (
          // Selected blocks view
          <>
            {/* Header */}
            <div className="jd-flex jd-items-center jd-justify-between jd-p-3 jd-border-b jd-border-border/50">
              <div className="jd-text-sm jd-font-medium">
                Selected {label.toLowerCase()}s
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground hover:jd-text-foreground"
              >
                <X className="jd-h-3 jd-w-3" />
              </Button>
            </div>

            {/* Selected items list */}
            <div className="jd-max-h-60 jd-overflow-y-auto">
              {items.length === 0 ? (
                <div className="jd-p-4 jd-text-center jd-text-sm jd-text-muted-foreground">
                  No {label.toLowerCase()}s selected
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="jd-flex jd-items-center jd-justify-between jd-p-3 jd-border-b jd-border-border/30 last:jd-border-b-0 hover:jd-bg-muted/50">
                    <div className="jd-flex-1 jd-min-w-0">
                      <div className="jd-text-sm jd-font-medium jd-truncate">
                        {getBlockName(item)}
                      </div>
                      {item.blockId && (
                        <div className="jd-text-xs jd-text-muted-foreground jd-truncate jd-mt-1">
                          {(() => {
                            const block = availableBlocks.find(b => b.id === item.blockId);
                            const content = block ? getLocalizedContent(block.content) : '';
                            return content.length > 50 ? `${content.substring(0, 50)}...` : content;
                          })()}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleItemRemove(item.id)}
                      className="jd-ml-2 jd-h-7 jd-w-7 jd-p-0 jd-text-muted-foreground hover:jd-text-destructive jd-flex-shrink-0"
                      title={`Remove ${label.toLowerCase()}`}
                    >
                      <Trash2 className="jd-h-3 jd-w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Add more button */}
            <div className="jd-p-3 jd-border-t jd-border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToAvailable}
                className="jd-w-full jd-justify-center"
                disabled={availableBlocksFiltered.length === 0}
              >
                <Plus className="jd-h-3 jd-w-3 jd-mr-1" />
                Add more {label.toLowerCase()}s
                {availableBlocksFiltered.length === 0 && (
                  <span className="jd-ml-1 jd-text-xs jd-text-muted-foreground">
                    (no more available)
                  </span>
                )}
              </Button>
            </div>
          </>
        ) : (
          // Available blocks view
          <>
            {/* Header with navigation */}
            <div className="jd-flex jd-items-center jd-justify-between jd-p-3 jd-border-b jd-border-border/50">
              <div className="jd-flex jd-items-center jd-gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToSelected}
                  className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground hover:jd-text-foreground"
                >
                  <ArrowLeft className="jd-h-3 jd-w-3" />
                </Button>
                <div className="jd-text-sm jd-font-medium">
                  Available {label.toLowerCase()}s
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground hover:jd-text-foreground"
              >
                <X className="jd-h-3 jd-w-3" />
              </Button>
            </div>

            {/* Available blocks list */}
            <div className="jd-max-h-60 jd-overflow-y-auto">
              {availableBlocksFiltered.length === 0 ? (
                <div className="jd-p-4 jd-text-center jd-text-sm jd-text-muted-foreground">
                  No more {label.toLowerCase()}s available
                </div>
              ) : (
                availableBlocksFiltered.map((block) => (
                  <div 
                    key={block.id} 
                    className="jd-flex jd-items-center jd-justify-between jd-p-3 jd-border-b jd-border-border/30 last:jd-border-b-0 hover:jd-bg-muted/50 jd-cursor-pointer"
                    onClick={() => handleAddBlock(String(block.id))}
                  >
                    <div className="jd-flex-1 jd-min-w-0">
                      <div className="jd-text-sm jd-font-medium jd-truncate">
                        {getLocalizedContent(block.title) || `${label} block`}
                      </div>
                      <div className="jd-text-xs jd-text-muted-foreground jd-truncate jd-mt-1">
                        {(() => {
                          const content = getLocalizedContent(block.content);
                          return content.length > 50 ? `${content.substring(0, 50)}...` : content;
                        })()}
                      </div>
                    </div>
                    <Plus className="jd-h-4 jd-w-4 jd-text-muted-foreground jd-ml-2 jd-flex-shrink-0" />
                  </div>
                ))
              )}
            </div>

            {/* Create new block option */}
            <div className="jd-p-3 jd-border-t jd-border-border/50">
              <div 
                className="jd-flex jd-items-center jd-gap-2 jd-p-2 jd-rounded jd-border jd-border-dashed jd-border-muted-foreground/50 hover:jd-border-primary/50 hover:jd-bg-primary/5 jd-cursor-pointer jd-transition-colors"
                onClick={() => handleAddBlock('create')}
              >
                <Plus className="jd-h-4 jd-w-4 jd-text-muted-foreground" />
                <span className="jd-text-sm jd-text-muted-foreground">
                  {getMessage(
                    'createTypeBlock',
                    [label.toLowerCase()],
                    `Create new ${label.toLowerCase()} block`
                  )}
                </span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface CompactMetadataProps {
  mode?: 'create' | 'customize';
  availableMetadataBlocks: Record<MetadataType, Block[]>;
}

export const CompactMetadataSection: React.FC<CompactMetadataProps> = ({
  mode = 'customize',
  availableMetadataBlocks
}) => {
  const {
    metadata,
    setMetadata,
    addNewBlock
  } = useTemplateEditor();

  const isDarkMode = useThemeDetector();
  const { openDialog } = useDialogManager();

  const blocksForType = useMemo(() => {
    if (mode !== 'customize') return availableMetadataBlocks;

    const result: Record<MetadataType, Block[]> = {} as Record<MetadataType, Block[]>;

    (Object.keys(METADATA_CONFIGS) as MetadataType[]).forEach(type => {
      const allBlocks = availableMetadataBlocks[type] || [];
      const published = allBlocks.filter(b => (b as any).published);

      const selectedIds: number[] = [];
      if (isMultipleMetadataType(type)) {
        const items = (metadata as any)[type as MultipleMetadataType] || [];
        items.forEach((it: any) => {
          if (it.blockId && !isNaN(it.blockId)) selectedIds.push(it.blockId);
        });
      } else {
        const id = (metadata as any)[type as SingleMetadataType];
        if (id && id !== 0) selectedIds.push(id);
      }

      const selectedBlocks = selectedIds
        .map(id => allBlocks.find(b => b.id === id))
        .filter(Boolean) as Block[];

      const combined: Block[] = [...selectedBlocks];
      published.forEach(b => {
        if (!combined.some(sb => sb.id === b.id)) combined.push(b);
      });

      result[type] = combined;
    });

    return result;
  }, [availableMetadataBlocks, metadata, mode]);

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
      <div className="jd-grid jd-grid-cols-8 jd-gap-3">
        {allMetadataTypes.map(type => {
          const config = METADATA_CONFIGS[type];
          const Icon = METADATA_ICONS[type];
          const assigned = isAssigned(type);
          const availableBlocks = blocksForType[type] || [];
          const items = isMultipleMetadataType(type)
            ? ((metadata as any)[type as MultipleMetadataType] || [])
            : [];

          return (
            <div key={type} className="jd-relative jd-group">
              {/* Ultra-compact metadata card */}
              <div className={cn(
                'jd-flex jd-flex-col jd-items-center jd-p-2 jd-rounded-lg jd-border jd-transition-all jd-duration-300',
                'jd-hover:jd-shadow-lg jd-cursor-pointer jd-relative jd-backdrop-blur-sm',
                assigned
                  ? 'jd-border-green-400 jd-bg-gradient-to-br jd-from-green-50 jd-to-green-100 jd-dark:jd-border-green-500 jd-dark:jd-from-green-900/30 jd-dark:jd-to-green-800/30'
                  : 'jd-border-gray-300 jd-bg-gradient-to-br jd-from-gray-50 jd-to-gray-100 jd-dark:jd-border-gray-600 jd-dark:jd-from-gray-800/50 jd-dark:jd-to-gray-700/50 jd-hover:jd-border-primary/50 jd-hover:jd-from-primary/5 jd-hover:jd-to-primary/10'
              )}>
                {/* Status indicator */}
                <div className={cn(
                  'jd-absolute jd-top-1.5 jd-right-1.5 jd-w-2 jd-h-2 jd-rounded-full jd-transition-all jd-duration-200',
                  assigned 
                    ? `${getBlockIconColors(config.blockType, isDarkMode)} jd-shadow-lg jd-shadow-green-500/50` 
                    : `jd-bg-gray-400 jd-dark:jd-bg-gray-500`
                )} />

                {/* Icon */}
                <div className={cn(
                  'jd-p-1.5 jd-rounded-lg jd-mb-1.5 jd-transition-all jd-duration-200',
                  assigned 
                    ? 'jd-bg-green-200 jd-text-green-800 jd-dark:jd-bg-green-800 jd-dark:jd-text-green-200' 
                    : 'jd-bg-gray-200 jd-text-gray-600 jd-dark:jd-bg-gray-700 jd-dark:jd-text-gray-300'
                )}>
                  <Icon className="jd-h-3 jd-w-3" />
                </div>

                {/* Label */}
                <span className="jd-text-xs jd-font-medium jd-text-center jd-leading-tight jd-truncate jd-w-full jd-text-foreground">
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
                    className={cn(
                      'jd-absolute jd-top-0 jd-left-0 jd-p-0 jd-transition-all jd-duration-200',
                      'jd-opacity-0 group-hover:jd-opacity-100 jd-bg-red-500 jd-text-white jd-rounded-full',
                      'jd-shadow-lg hover:jd-shadow-red-500/50 hover:jd-bg-red-600 jd-transform jd-scale-90 hover:jd-scale-100'
                    )}
                  >
                    <X className="jd-h-3 jd-w-3" />
                  </Button>
                )}
              </div>

              {/* Selection area */}
              <div className="jd-space-y-1">
                {isMultipleMetadataType(type) ? (
                  <MultipleMetadataDropdown
                    type={type as MultipleMetadataType}
                    items={items}
                    availableBlocks={availableBlocks}
                    onRemove={id =>
                      handleRemoveItem(type as MultipleMetadataType, id)
                    }
                    onAdd={val => handleAddItem(type as MultipleMetadataType, val)}
                    label={config.label}
                  />
                ) : (
                  <SingleMetadataDropdown
                    type={type as SingleMetadataType}
                    selectedBlockId={(metadata as any)[type as SingleMetadataType] || 0}
                    availableBlocks={availableBlocks}
                    onSelect={val => handleSelect(type, val)}
                    label={config.label}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};