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
  PromptMetadata,
  MetadataType,
  SingleMetadataType,
  MultipleMetadataType,
  MetadataItem,
  PRIMARY_METADATA,
  SECONDARY_METADATA,
  METADATA_CONFIGS,
  isMultipleMetadataType
} from '@/types/prompts/metadata';
import { Block } from '@/types/prompts/blocks';
import {
  updateSingleMetadata,
  updateCustomValue,
  addMetadataItem,
  removeMetadataItem,
  updateMetadataItem,
  reorderMetadataItems,
  addSecondaryMetadata,
  removeSecondaryMetadata
} from '@/utils/prompts/metadataUtils';

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

interface MetadataState {
  expandedMetadata: MetadataType | null;
  setExpandedMetadata: (type: MetadataType | null) => void;
  activeSecondaryMetadata: Set<MetadataType>;
  metadataCollapsed: boolean;
  setMetadataCollapsed: (collapsed: boolean) => void;
  secondaryMetadataCollapsed: boolean;
  setSecondaryMetadataCollapsed: (collapsed: boolean) => void;
}

interface MetadataSectionProps {
  // Add metadata as a prop instead of using context
  metadata: PromptMetadata;
  availableMetadataBlocks: Record<MetadataType, Block[]>;
  state: MetadataState;
  setMetadata: (updater: (metadata: PromptMetadata) => PromptMetadata) => void;
  showPrimary?: boolean;
  showSecondary?: boolean;
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({
  metadata,
  availableMetadataBlocks,
  state,
  setMetadata,
  showPrimary = true,
  showSecondary = true
}) => {
  const {
    expandedMetadata,
    setExpandedMetadata,
    activeSecondaryMetadata,
    metadataCollapsed,
    setMetadataCollapsed,
    secondaryMetadataCollapsed,
    setSecondaryMetadataCollapsed
  } = state;

  const handleSingleMetadataChange = useCallback(
    (type: SingleMetadataType, value: string) => {
      const blockId = parseInt(value, 10);
      setMetadata(prev => updateSingleMetadata(prev, type, isNaN(blockId) ? 0 : blockId));
    },
    [setMetadata]
  );

  const handleCustomChange = useCallback(
    (type: SingleMetadataType, value: string) => {
      setMetadata(prev => updateCustomValue(prev, type, value));
    },
    [setMetadata]
  );

  const handleAddMetadataItem = useCallback(
    (type: MultipleMetadataType) => {
      setMetadata(prev => addMetadataItem(prev, type));
    },
    [setMetadata]
  );

  const handleRemoveMetadataItem = useCallback(
    (type: MultipleMetadataType, itemId: string) => {
      setMetadata(prev => removeMetadataItem(prev, type, itemId));
    },
    [setMetadata]
  );

  const handleUpdateMetadataItem = useCallback(
    (type: MultipleMetadataType, itemId: string, updates: Partial<MetadataItem>) => {
      setMetadata(prev => updateMetadataItem(prev, type, itemId, updates));
    },
    [setMetadata]
  );

  const handleReorderMetadataItems = useCallback(
    (type: MultipleMetadataType, newItems: MetadataItem[]) => {
      setMetadata(prev => reorderMetadataItems(prev, type, newItems));
    },
    [setMetadata]
  );

  const handleAddSecondaryMetadata = useCallback(
    (type: MetadataType) => {
      setMetadata(prev => addSecondaryMetadata(prev, type));
      setExpandedMetadata(type);
    },
    [setMetadata, setExpandedMetadata]
  );

  const handleRemoveSecondaryMetadata = useCallback(
    (type: MetadataType) => {
      setMetadata(prev => removeSecondaryMetadata(prev, type));
      if (expandedMetadata === type) setExpandedMetadata(null);
    },
    [setMetadata, expandedMetadata, setExpandedMetadata]
  );
  
  const isDarkMode = useThemeDetector();

  return (
    <>
      {showPrimary && (
        <div className="jd-flex-shrink-0">
          <div className="jd-flex jd-items-center jd-justify-between jd-mb-3">
            <h3 className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
              Prompt Essentials
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMetadataCollapsed(!metadataCollapsed)}
              className="jd-h-6 jd-w-6 jd-p-0"
            >
              {metadataCollapsed ? <ChevronDown className="jd-h-4 jd-w-4" /> : <ChevronUp className="jd-h-4 jd-w-4" />}
            </Button>
          </div>

          {!metadataCollapsed && (
            <div className="jd-grid jd-grid-cols-3 jd-gap-4">
              {PRIMARY_METADATA.map((type) => (
                <div key={type} className="jd-transform jd-transition-all jd-duration-300 hover:jd-scale-105">
                  <MetadataCard
                    type={type}
                    availableBlocks={availableMetadataBlocks[type] || []}
                    expanded={expandedMetadata === type}
                    value={metadata[type] || 0}
                    isPrimary
                    onChange={(v) => handleSingleMetadataChange(type, String(v))}
                    onToggle={() => setExpandedMetadata(expandedMetadata === type ? null : type)}
                  />
                </div>
              ))}
            </div>
          )}
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
              {activeSecondaryMetadata.size > 0 && (
                <div className="jd-grid jd-grid-cols-2 jd-gap-3 jd-mb-3">
                  {Array.from(activeSecondaryMetadata).map((type) => (
                    <div key={type} className="jd-transform jd-transition-all jd-duration-300 hover:jd-scale-105">
                      <MetadataCard
                        type={type}
                        availableBlocks={availableMetadataBlocks[type] || []}
                        expanded={expandedMetadata === type}
                        value={!isMultipleMetadataType(type) ? (metadata[type as SingleMetadataType] || 0) : undefined}
                        items={isMultipleMetadataType(type) ? (metadata[type] || []) : undefined}
                        onChange={(val) => {
                          if (isMultipleMetadataType(type)) {
                            handleReorderMetadataItems(type as MultipleMetadataType, val as MetadataItem[]);
                          } else {
                            handleSingleMetadataChange(type as SingleMetadataType, String(val));
                          }
                        }}
                        onToggle={() => setExpandedMetadata(expandedMetadata === type ? null : type)}
                        onRemove={() => handleRemoveSecondaryMetadata(type)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="jd-flex jd-flex-wrap jd-gap-2">
                {SECONDARY_METADATA
                  .filter(type => !activeSecondaryMetadata.has(type))
                  .map((type) => {
                    const config = METADATA_CONFIGS[type];
                    const Icon = METADATA_ICONS[type];
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
                          isDarkMode
                            ? 'jd-bg-gray-800/50 hover:jd-bg-gray-700/50'
                            : 'jd-bg-white/70 hover:jd-bg-white/90'
                        )}
                      >
                        <Plus className="jd-h-3 jd-w-3" />
                        <Icon className="jd-h-3 jd-w-3" />
                        {config.label}
                      </Button>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};