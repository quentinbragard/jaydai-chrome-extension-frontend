// src/components/prompts/blocks/MetadataCard.tsx
import React from 'react';
import {
  Block,
  MetadataType,
  METADATA_CONFIGS,
  isMultipleMetadataType,
  SingleMetadataType,
  MultipleMetadataType
} from '@/types/prompts/metadata';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Trash2, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/core/utils/classNames';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useDialogManager } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import {
  getLocalizedContent,
  getBlockTypeColors,
  getBlockIconColors,
  getBlockTextColors,
  getBlockTypeIcon
} from '@/utils/prompts/blockUtils';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { useTemplateEditor } from '@/components/dialogs/prompts/TemplateEditorDialog/TemplateEditorContext';
import {
  updateSingleMetadata,
  addMetadataItem,
  removeMetadataItem,
  updateMetadataItem
} from '@/utils/prompts/metadataUtils';

interface MetadataCardProps {
  type: MetadataType;
  availableBlocks: Block[];
  expanded: boolean;
  isPrimary?: boolean;
  onToggle: () => void;
  onRemove?: () => void;
}

export const MetadataCard: React.FC<MetadataCardProps> = ({
  type,
  availableBlocks,
  expanded,
  isPrimary = false,
  onToggle,
  onRemove
}) => {
  const config = METADATA_CONFIGS[type];
  const isDarkMode = useThemeDetector();
  const cardColors = getBlockTypeColors(config.blockType, isDarkMode);
  const iconColors = getBlockIconColors(config.blockType, isDarkMode);
  const Icon = getBlockTypeIcon(config.blockType);
  const { openDialog } = useDialogManager();
  const { metadata, setMetadata, addNewBlock } = useTemplateEditor();

  const value =
    !isMultipleMetadataType(type)
      ? (metadata[type as SingleMetadataType] as number) || 0
      : undefined;

  const items = React.useMemo(() => {
    if (isMultipleMetadataType(type)) {
      const key = type === 'constraint' ? 'constraint' : 'example';
      return (metadata as any)[key] || [];
    }
    return [];
  }, [metadata, type]);

  const [addMenuOpen, setAddMenuOpen] = React.useState(false);

  const cardRef = useClickOutside<HTMLDivElement>(() => {
    if (expanded) {
      onToggle();
    }
  }, expanded);

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleSelect = (val: string) => {
    if (val === 'create') {
      openDialog(DIALOG_TYPES.CREATE_BLOCK, {
        initialType: config.blockType,
        onBlockCreated: b => {
          addNewBlock(b);
          setMetadata(prev =>
            updateSingleMetadata(prev, type as SingleMetadataType, b.id)
          );
          onToggle();
        }
      });
      return;
    }
    const blockId = parseInt(val, 10);
    setMetadata(prev =>
      updateSingleMetadata(
        prev,
        type as SingleMetadataType,
        isNaN(blockId) ? 0 : blockId
      )
    );
    if (val !== '0') onToggle();
  };

  const handleItemSelect = (id: string, val: string) => {
    if (val === 'create') {
      openDialog(DIALOG_TYPES.CREATE_BLOCK, {
        initialType: config.blockType,
        onBlockCreated: b => {
          addNewBlock(b);
          setMetadata(prev =>
            updateMetadataItem(prev, type as MultipleMetadataType, id, {
              blockId: b.id,
              value: getLocalizedContent(b.content)
            })
          );
        }
      });
      return;
    }

    const blockId = parseInt(val, 10);
    const block = availableBlocks.find(b => b.id === blockId);
    setMetadata(prev =>
      updateMetadataItem(prev, type as MultipleMetadataType, id, {
        blockId: isNaN(blockId) ? 0 : blockId,
        value: block ? getLocalizedContent(block.content) : ''
      })
    );
  };

  const removeItem = (id: string) => {
    setMetadata(prev => removeMetadataItem(prev, type as MultipleMetadataType, id));
  };

  const handleAddSelect = (val: string) => {
    if (val === 'create') {
      openDialog(DIALOG_TYPES.CREATE_BLOCK, {
        initialType: config.blockType,
        onBlockCreated: b => {
          addNewBlock(b);
          setMetadata(prev =>
            addMetadataItem(prev, type as MultipleMetadataType, {
              blockId: b.id,
              value: getLocalizedContent(b.content)
            })
          );
        }
      });
      setAddMenuOpen(false);
      return;
    }

    const blockId = parseInt(val, 10);
    const block = availableBlocks.find(b => b.id === blockId);
    setMetadata(prev =>
      addMetadataItem(prev, type as MultipleMetadataType, {
        blockId: isNaN(blockId) ? undefined : blockId,
        value: block ? getLocalizedContent(block.content) : ''
      })
    );
    setAddMenuOpen(false);
  };

  const selectedBlock = value && value !== 0 ? availableBlocks.find(b => b.id === value) : null;

  return (
    <Card
      ref={cardRef}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('button') || target.closest('[role="combobox"]');
        if (!isInteractive) onToggle();
      }}
      className={cn(
        'jd-transition-all jd-duration-300 jd-cursor-pointer hover:jd-shadow-md',
        'jd-border-2 jd-backdrop-blur-sm jd-py-2 jd-select-none',
        cardColors,
        isPrimary && 'jd-border-primary/20',
        expanded &&
          (isDarkMode
            ? 'jd-ring-2 jd-ring-primary/50 jd-shadow-lg jd-bg-gray-800'
            : 'jd-ring-2 jd-ring-primary/50 jd-shadow-lg jd-bg-white')
      )}
    >
      <CardContent className="jd-p-4">
        <div className="jd-flex jd-items-center jd-justify-between">
          <div className="jd-flex jd-items-center jd-gap-2">
            <div className={cn('jd-p-1.5 jd-rounded-md', iconColors)}>
              <Icon className="jd-h-4 jd-w-4" />
            </div>
            <span className={cn('jd-font-medium', getBlockTextColors(config.blockType, isDarkMode))}>
              {config.label}
              {isMultipleMetadataType(type) && items.length > 0 ? ` (${items.length})` : ''}
            </span>
          </div>
          <div className="jd-flex jd-items-center jd-gap-1" onClick={stopPropagation}>
            {!isPrimary && onRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground jd-hover:jd-text-destructive"
              >
                <Trash2 className="jd-h-3 jd-w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="jd-h-6 jd-w-6 jd-p-0"
            >
              {expanded ? <ChevronUp className="jd-h-3 jd-w-3" /> : <ChevronDown className="jd-h-3 jd-w-3" />}
            </Button>
          </div>
        </div>

        {expanded ? (
          <div className="jd-space-y-3 jd-mt-3" onClick={stopPropagation}>
            {!isMultipleMetadataType(type) ? (
              <Select value={value ? String(value) : '0'} onValueChange={handleSelect}>
                <SelectTrigger className="jd-w-full">
                  <SelectValue placeholder={`Select ${config.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent className="jd-z-[10010]">
                  <SelectItem value="0">None</SelectItem>
                  {availableBlocks.map((block) => (
                    <SelectItem key={block.id} value={String(block.id)}>
                      {getLocalizedContent(block.title) || `${config.label} block`}
                    </SelectItem>
                  ))}
                  <SelectItem value="create">
                    <div className="jd-flex jd-items-center jd-gap-2">
                      <Plus className="jd-h-3 jd-w-3" />
                      Create {config.label.toLowerCase()} block
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <>
                {items.map((item) => (
                  <div key={item.id} className="jd-flex jd-items-center jd-gap-2">
                    <Select
                      value={item.blockId ? String(item.blockId) : '0'}
                      onValueChange={(v) => handleItemSelect(item.id, v)}
                      className="jd-flex-1"
                    >
                      <SelectTrigger className="jd-w-full">
                        <SelectValue placeholder={`Select ${config.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        {availableBlocks.map((block) => (
                          <SelectItem key={block.id} value={String(block.id)}>
                            {getLocalizedContent(block.title) || `${config.label} block`}
                          </SelectItem>
                        ))}
                        <SelectItem value="create">
                          <div className="jd-flex jd-items-center jd-gap-2">
                            <Plus className="jd-h-3 jd-w-3" />
                            Create {config.label.toLowerCase()} block
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                      className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground jd-hover:jd-text-destructive"
                    >
                      <Trash2 className="jd-h-3 jd-w-3" />
                    </Button>
                  </div>
                ))}
                <DropdownMenu open={addMenuOpen} onOpenChange={setAddMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="jd-w-full jd-border-dashed">
                      <Plus className="jd-h-4 jd-w-4 jd-mr-2" /> Add {config.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="jd-w-full jd-z-[10010]">
                    {availableBlocks.map(block => (
                      <DropdownMenuItem key={block.id} onClick={() => handleAddSelect(String(block.id))}>
                        {getLocalizedContent(block.title) || `${config.label} block`}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem onClick={() => handleAddSelect('create')}>
                      <div className="jd-flex jd-items-center jd-gap-2">
                        <Plus className="jd-h-3 jd-w-3" />
                        Create {config.label.toLowerCase()} block
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        ) : (
          <div className="jd-text-sm jd-text-muted-foreground jd-mt-2">
            {!isMultipleMetadataType(type) ? (
              value && selectedBlock ? (
                <div className="jd-text-xs jd-line-clamp-2">
                  {getLocalizedContent(selectedBlock.content).substring(0, 60)}
                  {getLocalizedContent(selectedBlock.content).length > 60 ? '...' : ''}
                </div>
              ) : (
                <div className="jd-text-xs">Click to set {config.label.toLowerCase()}</div>
              )
            ) : items.length > 0 ? (
              <>
                {items.slice(0, 2).map((it, idx) => (
                  <div key={it.id} className="jd-truncate">
                    {idx + 1}. {it.value.substring(0, 50)}{it.value.length > 50 ? '...' : ''}
                  </div>
                ))}
                {items.length > 2 && (
                  <div className="jd-text-xs jd-opacity-75">+{items.length - 2} more...</div>
                )}
              </>
            ) : (
              <div className="jd-text-xs">Click to add {config.label.toLowerCase()}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

