import React from 'react';
import { Block, MetadataType, METADATA_CONFIGS } from '@/types/prompts/metadata';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { SaveBlockButton } from './SaveBlockButton';
import { cn } from '@/core/utils/classNames';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { getLocalizedContent } from '@/components/dialogs/templates/utils/blockUtils';
import { useThemeDetector } from '@/hooks/useThemeDetector';

interface MetadataCardProps {
  type: MetadataType;
  icon: React.ComponentType<any>;
  availableBlocks: Block[];
  expanded: boolean;
  selectedId: number;
  customValue: string;
  isPrimary?: boolean;
  onSelect: (value: string) => void;
  onCustomChange: (value: string) => void;
  onToggle: () => void;
  onRemove?: () => void;
  onSaveBlock?: (block: Block) => void;
}

export const MetadataCard: React.FC<MetadataCardProps> = ({
  type,
  icon: Icon,
  availableBlocks,
  expanded,
  selectedId,
  customValue,
  isPrimary = false,
  onSelect,
  onCustomChange,
  onToggle,
  onRemove,
  onSaveBlock
}) => {
  const config = METADATA_CONFIGS[type];
  const isDarkMode = useThemeDetector();

  // Handle card click - only toggle if clicking on the card itself, not on interactive elements
  const handleCardClick = (e: React.MouseEvent) => {
    // If the target is an interactive element or its child, don't toggle
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button') || 
                         target.closest('[role="combobox"]') || 
                         target.closest('select') || 
                         target.closest('textarea') ||
                         target.closest('[data-radix-collection-item]');
    
    if (!isInteractive) {
      onToggle();
    }
  };

  // Stop propagation for interactive elements
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        'jd-transition-all jd-duration-200 jd-cursor-pointer hover:jd-shadow-md',
        isPrimary ? 'jd-border-2 jd-border-primary/20 jd-bg-primary/5' : 'jd-border jd-border-muted jd-bg-muted/20',
        expanded &&
          (isDarkMode
            ? 'jd-ring-2 jd-ring-primary/50 jd-shadow-lg jd-bg-gray-800'
            : 'jd-ring-2 jd-ring-primary/50 jd-shadow-lg jd-bg-white')
      )}
    >
      <CardContent className="jd-p-4">
        <div className="jd-flex jd-items-center jd-justify-between jd-mb-2">
          <div className="jd-flex jd-items-center jd-gap-2">
            <Icon className={cn('jd-h-4 jd-w-4', isPrimary ? 'jd-text-primary' : 'jd-text-muted-foreground')} />
            <span className={cn('jd-font-medium', isPrimary ? 'jd-text-primary' : 'jd-text-foreground')}>
              {config.label}
            </span>
          </div>
          <div className="jd-flex jd-items-center jd-gap-1" onClick={stopPropagation}>
            {!isPrimary && onRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
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
          <div className="jd-space-y-3" onClick={stopPropagation}>
            <Select 
              value={selectedId ? String(selectedId) : '0'} 
              onValueChange={onSelect}
            >
              <SelectTrigger className="jd-w-full">
                <SelectValue placeholder="Select or create custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                {availableBlocks.map((block) => (
                  <SelectItem key={block.id} value={String(block.id)}>
                    <div className="jd-flex jd-items-center jd-gap-2">
                      <span className="jd-font-medium jd-truncate jd-max-w-32">
                        {getLocalizedContent(block.title) || `${type} block`}
                      </span>
                      <span className="jd-text-xs jd-text-muted-foreground jd-truncate jd-max-w-48">
                        {typeof block.content === 'string'
                          ? block.content.substring(0, 40) + (block.content.length > 40 ? '...' : '')
                          : (block.content[getCurrentLanguage()] || '').substring(0, 40) + 
                            ((block.content[getCurrentLanguage()] || '').length > 40 ? '...' : '')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="custom">
                  <div className="jd-flex jd-items-center jd-gap-2">
                    <Plus className="jd-h-3 jd-w-3" />
                    Create custom {type}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {(!selectedId || selectedId === 0) && (
              <>
                <Textarea
                  value={customValue}
                  onChange={(e) => onCustomChange(e.target.value)}
                  placeholder={`Enter custom ${type} content...`}
                  rows={3}
                  className="jd-resize-none"
                  onClick={stopPropagation}
                />
                {customValue && (
                  <SaveBlockButton
                    type={config.blockType}
                    content={customValue}
                    onSaved={(b) => onSaveBlock && onSaveBlock(b)}
                    className="jd-h-6 jd-w-6 jd-p-0 jd-text-muted-foreground jd-hover:jd-text-primary"
                  />
                )}
              </>
            )}
          </div>
        ) : (
          <div className="jd-text-sm jd-text-muted-foreground">
            {selectedId && selectedId !== 0
              ? getLocalizedContent(availableBlocks.find((b) => b.id === selectedId)?.title) || `${type} block`
              : customValue
                ? customValue.substring(0, 50) + (customValue.length > 50 ? '...' : '')
              : `Click to set ${type}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
};