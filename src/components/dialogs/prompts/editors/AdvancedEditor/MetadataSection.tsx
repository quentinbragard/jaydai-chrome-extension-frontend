// src/components/dialogs/prompts/editors/AdvancedEditor/MetadataSection.tsx
import React from 'react';
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
import { MultipleMetadataCard } from '@/components/prompts/blocks/MultipleMetadataCard';
import {
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
import { PromptMetadata } from '@/types/prompts/metadata';
import { extractCustomValues } from '@/utils/prompts/metadataUtils';

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

interface MetadataHandlers {
  onSingleMetadataChange: (type: SingleMetadataType, value: string) => void;
  onCustomChange: (type: SingleMetadataType, value: string) => void;
  onAddMetadataItem: (type: MultipleMetadataType) => void;
  onRemoveMetadataItem: (type: MultipleMetadataType, itemId: string) => void;
  onUpdateMetadataItem: (type: MultipleMetadataType, itemId: string, updates: Partial<MetadataItem>) => void;
  onReorderMetadataItems: (type: MultipleMetadataType, newItems: MetadataItem[]) => void;
  onAddSecondaryMetadata: (type: MetadataType) => void;
  onRemoveSecondaryMetadata: (type: MetadataType) => void;
  onSaveBlock: (block: Block) => void;
}

interface MetadataSectionProps {
  availableMetadataBlocks: Record<MetadataType, Block[]>;
  state: MetadataState;
  handlers: MetadataHandlers;
  showPrimary?: boolean;
  showSecondary?: boolean;
  metadata: PromptMetadata;
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({
  availableMetadataBlocks,
  state,
  handlers,
  showPrimary = true,
  showSecondary = true,
  metadata
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

  const {
    onSingleMetadataChange,
    onCustomChange,
    onAddMetadataItem,
    onRemoveMetadataItem,
    onUpdateMetadataItem,
    onReorderMetadataItems,
    onAddSecondaryMetadata,
    onRemoveSecondaryMetadata,
    onSaveBlock
  } = handlers;
  const isDarkMode = useThemeDetector();

  // Extract custom values for all single metadata types
  const customValues = React.useMemo(() => extractCustomValues(metadata), [metadata]);

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
                    icon={METADATA_ICONS[type]}
                    availableBlocks={availableMetadataBlocks[type] || []}
                    expanded={expandedMetadata === type}
                    selectedId={metadata[type] || 0}
                    customValue={customValues[type] || ''}
                    isPrimary
                    onSelect={(v) => onSingleMetadataChange(type, v)}
                    onCustomChange={(v) => onCustomChange(type, v)}
                    onToggle={() => setExpandedMetadata(expandedMetadata === type ? null : type)}
                    onSaveBlock={onSaveBlock}
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
                      {isMultipleMetadataType(type) ? (
                        <MultipleMetadataCard
                          type={type}
                          icon={METADATA_ICONS[type]}
                          availableBlocks={availableMetadataBlocks[type] || []}
                          items={metadata[type] || []}
                          expanded={expandedMetadata === type}
                          onAddItem={() => onAddMetadataItem(type)}
                          onRemoveItem={(itemId) => onRemoveMetadataItem(type, itemId)}
                          onUpdateItem={(itemId, updates) => onUpdateMetadataItem(type, itemId, updates)}
                          onToggle={() => setExpandedMetadata(expandedMetadata === type ? null : type)}
                          onRemove={() => onRemoveSecondaryMetadata(type)}
                          onSaveBlock={onSaveBlock}
                          onReorderItems={(newItems) => onReorderMetadataItems(type, newItems)}
                        />
                      ) : (
                        <MetadataCard
                          type={type as SingleMetadataType}
                          icon={METADATA_ICONS[type]}
                          availableBlocks={availableMetadataBlocks[type] || []}
                          expanded={expandedMetadata === type}
                          selectedId={metadata[type as SingleMetadataType] || 0}
                          customValue={customValues[type as SingleMetadataType] || ''}
                          onSelect={(v) => onSingleMetadataChange(type as SingleMetadataType, v)}
                          onCustomChange={(v) => onCustomChange(type as SingleMetadataType, v)}
                          onToggle={() => setExpandedMetadata(expandedMetadata === type ? null : type)}
                          onRemove={() => onRemoveSecondaryMetadata(type)}
                          onSaveBlock={onSaveBlock}
                        />
                      )}
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
                        onClick={() => onAddSecondaryMetadata(type)}
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