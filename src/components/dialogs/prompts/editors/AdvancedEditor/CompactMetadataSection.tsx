// src/components/dialogs/prompts/editors/AdvancedEditor/CompactMetadataSection.tsx
import React, { useCallback, useState } from 'react';
import { cn } from '@/core/utils/classNames';
import CompactMetadataCard from './CompactMetadataCard';
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
import { Block } from '@/types/prompts/blocks';
import { useTemplateEditor } from '../../TemplateEditorDialog/TemplateEditorContext';
import {
  updateSingleMetadata,
  addMetadataItem,
  removeMetadataItem,
  updateMetadataItem
} from '@/utils/prompts/metadataUtils';
import { useDialogManager } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { getLocalizedContent } from '@/utils/prompts/blockUtils';


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

  const [expandedTypes, setExpandedTypes] = useState<
    Partial<Record<MultipleMetadataType, boolean>>
  >({});

  const toggleExpanded = useCallback((type: MultipleMetadataType) => {
    setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  }, []);

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
          const assigned = isAssigned(type);
          const availableBlocks = availableMetadataBlocks[type] || [];
          const items = isMultipleMetadataType(type)
            ? ((metadata as any)[type as MultipleMetadataType] || [])
            : [];

          return (
            <CompactMetadataCard
              key={type}
              type={type}
              assigned={assigned}
              items={items}
              availableBlocks={availableBlocks}
              expanded={!!expandedTypes[type as MultipleMetadataType]}
              isDarkMode={isDarkMode}
              onToggleExpand={() => toggleExpanded(type as MultipleMetadataType)}
              onSelect={val => handleSelect(type, val)}
              onItemSelect={(id, val) => handleItemSelect(type as MultipleMetadataType, id, val)}
              onAddItem={val => handleAddItem(type as MultipleMetadataType, val)}
              onRemoveItem={id => handleRemoveItem(type as MultipleMetadataType, id)}
              onRemove={() => handleRemove(type)}
            />
          );
        })}
      </div>
    </div>
  );
}
};

