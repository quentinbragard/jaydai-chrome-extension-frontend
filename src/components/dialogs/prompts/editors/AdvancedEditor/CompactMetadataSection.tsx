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
import { Plus, X } from 'lucide-react';
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
import { CompactMetadataCard } from './components/CompactMetadataCard';

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
    if (mode !== 'customize') {
      const result: Record<MetadataType, Block[]> = {} as Record<MetadataType, Block[]>;

      (Object.keys(METADATA_CONFIGS) as MetadataType[]).forEach(type => {
        const allBlocks = availableMetadataBlocks[type] || [];
        result[type] = allBlocks.filter(b => (b as any).published);
      });

      return result;
    }

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
        {getMessage('addBlocksTitle', undefined, 'Add some blocks to your prompt')}
      </h3>

      {/* Ultra-compact metadata grid */}
      <div className="jd-grid jd-grid-cols-8 jd-gap-3">
        {allMetadataTypes.map(type => {
          const assigned = isAssigned(type);
          const availableBlocks = blocksForType[type] || [];
          const items = isMultipleMetadataType(type)
            ? ((metadata as any)[type as MultipleMetadataType] || [])
            : [];
          const selectedId = (metadata as any)[type as SingleMetadataType] || 0;

          return (
            <CompactMetadataCard
              key={type}
              type={type}
              assigned={assigned}
              isDarkMode={isDarkMode}
              availableBlocks={availableBlocks}
              items={items}
              selectedBlockId={selectedId}
              onSelect={val => handleSelect(type, val)}
              onAddItem={val => handleAddItem(type as MultipleMetadataType, val)}
              onRemoveItem={id => handleRemoveItem(type as MultipleMetadataType, id)}
              onRemove={() => handleRemove(type)}
            />
          );
        })}
      </div>
    </div>
  );
};
