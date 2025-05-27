import React from 'react';
import { Block, MetadataType, METADATA_CONFIGS } from '@/components/templates/metadata/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { getCurrentLanguage } from '@/core/utils/i18n';

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
  onRemove
}) => {
  const config = METADATA_CONFIGS[type];

  return (
    <Card
      onClick={onToggle}
      className={cn(
        'jd-transition-all jd-duration-200 jd-cursor-pointer hover:jd-shadow-md',
        isPrimary ? 'jd-border-2 jd-border-primary/20' : 'jd-border jd-border-muted jd-bg-muted/20',
        expanded && 'jd-ring-2 jd-ring-primary/50 jd-shadow-lg'
      )}
    >
      <CardContent className="jd-p-4">
        <div className="jd-flex jd-items-center jd-justify-between jd-mb-2">
          <div className="jd-flex jd-items-center jd-gap-2">
            <Icon className={cn('jd-h-4 jd-w-4', isPrimary ? 'jd-text-primary' : 'jd-text-muted-foreground')} />
            <span className={cn('jd-font-medium', isPrimary ? 'jd-text-primary' : 'jd-text-foreground')}>
              {config.emoji} {config.label}
            </span>
          </div>
          <div className="jd-flex jd-items-center jd-gap-1">
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
          <div className="jd-space-y-3">
            <Select value={selectedId ? String(selectedId) : '0'} onValueChange={onSelect}>
              <SelectTrigger className="jd-w-full">
                <SelectValue placeholder="Select or create custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                {availableBlocks.map((block) => (
                  <SelectItem key={block.id} value={String(block.id)}>
                    <div className="jd-flex jd-items-center jd-gap-2">
                      <span className="jd-font-medium jd-truncate jd-max-w-32">
                        {block.name || `${type} block`}
                      </span>
                      <span className="jd-text-xs jd-text-muted-foreground jd-truncate jd-max-w-48">
                        {typeof block.content === 'string'
                          ? block.content.substring(0, 40) + '...'
                          : (block.content[getCurrentLanguage()] || '').substring(0, 40) + '...'}
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
              <Textarea
                value={customValue}
                onChange={(e) => onCustomChange(e.target.value)}
                placeholder={`Enter custom ${type} content...`}
                rows={3}
                className="resize-none"
              />
            )}
          </div>
        ) : (
          <div className="jd-text-sm jd-text-muted-foreground">
            {selectedId && selectedId !== 0
              ? availableBlocks.find((b) => b.id === selectedId)?.name || `${type} block`
              : customValue
              ? customValue.substring(0, 50) + (customValue.length > 50 ? '...' : '')
              : `Click to set ${type}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
