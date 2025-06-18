// src/components/dialogs/prompts/editors/AdvancedEditor/MetadataSection.tsx
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  User,
  MessageSquare,
  Target,
  Users,
  Type,
  Layout,
  Palette,
  Ban
} from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { useThemeDetector } from '@/hooks/useThemeDetector';

import { MetadataCard } from '@/components/prompts/blocks/MetadataCard';
import {
  MetadataType,
  PRIMARY_METADATA,
  SECONDARY_METADATA,
  METADATA_CONFIGS
} from '@/types/prompts/metadata';
import { Block } from '@/types/prompts/blocks';
import { useTemplateEditor } from '../../TemplateEditorDialog/TemplateEditorContext';
import { addSecondaryMetadata, removeSecondaryMetadata } from '@/utils/prompts/metadataUtils';

const METADATA_ICONS: Record<MetadataType, React.ComponentType<any>> = {
  role: User,
  context: MessageSquare,
  goal: Target,
  audience: Users,
  output_format: Type,
  example: Layout,
  tone_style: Palette,
  constraint: Ban
};

interface MetadataSectionProps {
  availableMetadataBlocks: Record<MetadataType, Block[]>;
  showPrimary?: boolean;
  showSecondary?: boolean;
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({
  availableMetadataBlocks,
  showPrimary = true,
  showSecondary = true
}) => {
  const {
    setMetadata,
    expandedMetadata,
    toggleExpandedMetadata,
    activeSecondaryMetadata,
    metadataCollapsed,
    setMetadataCollapsed,
    secondaryMetadataCollapsed,
    setSecondaryMetadataCollapsed
  } = useTemplateEditor();


  const handleAddSecondaryMetadata = useCallback(
    (type: MetadataType) => {
      setMetadata(prev => addSecondaryMetadata(prev, type));
      if (!expandedMetadata.has(type)) toggleExpandedMetadata(type);
    },
    [setMetadata, expandedMetadata, toggleExpandedMetadata]
  );

  const handleRemoveSecondaryMetadata = useCallback(
    (type: MetadataType) => {
      setMetadata(prev => removeSecondaryMetadata(prev, type));
      if (expandedMetadata.has(type)) toggleExpandedMetadata(type);
    },
    [setMetadata, expandedMetadata, toggleExpandedMetadata]
  );
  
  const isDarkMode = useThemeDetector();

  const renderCards = (
    types: MetadataType[],
    isPrimary: boolean,
    onRemove?: (t: MetadataType) => void
  ) => (
    <div
      className={cn(
        isPrimary ? 'jd-grid jd-grid-cols-3 jd-gap-4' : 'jd-grid jd-grid-cols-2 jd-gap-3 jd-mb-3'
      )}
    >
      {types.map(type => (
        <div
          key={type}
          className="jd-transform jd-transition-all jd-duration-300 hover:jd-scale-105"
        >
          <MetadataCard
            type={type}
            availableBlocks={availableMetadataBlocks[type] || []}
            expanded={expandedMetadata.has(type)}
            isPrimary={isPrimary}
            onToggle={() => toggleExpandedMetadata(type)}
            onRemove={onRemove ? () => onRemove(type) : undefined}
          />
        </div>
      ))}
    </div>
  );

  const renderAddButtons = () => (
    <div className="jd-flex jd-flex-wrap jd-gap-2">
      {SECONDARY_METADATA.filter(t => !activeSecondaryMetadata.has(t)).map(type => {
        const Icon = METADATA_ICONS[type];
        const config = METADATA_CONFIGS[type];
        return (
          <Button
            key={type}
            variant="outline"
            size="sm"
            onClick={() => handleAddSecondaryMetadata(type)}
            className={cn(
              'jd-flex jd-items-center jd-gap-1 jd-text-xs',
              'jd-transition-all jd-duration-300',
              'hover:jd-scale-105 hover:jd-shadow-md',
              isDarkMode ? 'jd-bg-gray-800/50 hover:jd-bg-gray-700/50' : 'jd-bg-white/70 hover:jd-bg-white/90'
            )}
          >
            <Plus className="jd-h-3 jd-w-3" />
            <Icon className="jd-h-3 jd-w-3" />
            {config.label}
          </Button>
        );
      })}
    </div>
  );

  return (
    <>
      {showPrimary && (
        <div className="jd-flex-shrink-0">
          <div className="jd-flex jd-items-center jd-justify-between jd-mb-3">
            <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">Prompt Essentials</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMetadataCollapsed(!metadataCollapsed)}
              className="jd-h-6 jd-w-6 jd-p-0"
            >
              {metadataCollapsed ? <ChevronDown className="jd-h-4 jd-w-4" /> : <ChevronUp className="jd-h-4 jd-w-4" />}
            </Button>
          </div>

          {!metadataCollapsed && renderCards(PRIMARY_METADATA, true)}
        </div>
      )}

      {showSecondary && (
        <div className="jd-flex-shrink-0">
          <div className="jd-flex jd-items-center jd-justify-between jd-mb-3">
            <h4 className="jd-text-sm jd-font-medium jd-text-muted-foreground jd-flex jd-items-center jd-gap-2">
              Additional Elements
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSecondaryMetadataCollapsed(!secondaryMetadataCollapsed)}
              className="jd-h-6 jd-w-6 jd-p-0"
            >
              {secondaryMetadataCollapsed ? <ChevronDown className="jd-h-4 jd-w-4" /> : <ChevronUp className="jd-h-4 jd-w-4" />}
            </Button>
          </div>

          {!secondaryMetadataCollapsed && (
            <>
              {activeSecondaryMetadata.size > 0 &&
                renderCards(Array.from(activeSecondaryMetadata), false, handleRemoveSecondaryMetadata)}
              {renderAddButtons()}
            </>
          )}
        </div>
      )}
    </>
  );
};