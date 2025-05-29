import React, { useEffect, useState, useRef } from 'react';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { blocksApi } from '@/services/api/BlocksApi';
import { Block } from '@/types/prompts/blocks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyMessage } from '@/components/panels/TemplatesPanel/EmptyMessage';
import {
  getBlockTypeIcon,
  getBlockTypeColors,
  getBlockIconColors,
  buildPromptPart,
  BLOCK_TYPE_LABELS
} from '@/components/prompts/blocks/blockUtils';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { insertIntoPromptArea } from '@/utils/templates/placeholderUtils';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
  SortableContext as SortableContextProvider
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Search, 
  Plus, 
  X, 
  GripVertical, 
  Eye, 
  Code, 
  Sparkles,
  Filter,
  ArrowRight,
  Copy
} from 'lucide-react';
import { cn } from '@/core/utils/classNames';

// Sortable Block Component
function SortableSelectedBlock({ block, isDark, onRemove, isExpanded, onToggleExpand }: {
  block: Block;
  isDark: boolean;
  onRemove: (id: number) => void;
  isExpanded: boolean;
  onToggleExpand: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = getBlockTypeIcon(block.type);
  const iconBg = getBlockIconColors(block.type, isDark);
  const title = typeof block.title === 'string' ? block.title : block.title?.en || 'Untitled';
  const content = typeof block.content === 'string' ? block.content : block.content.en || '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative border rounded-lg p-3 bg-background transition-all duration-200",
        isDragging ? "shadow-lg ring-2 ring-primary/20" : "hover:shadow-md"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(block.id)}
        className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
      >
        <X className="h-3 w-3 text-destructive" />
      </button>

      <div className="flex items-start gap-3 ml-6 mr-6">
        <span className={`p-1.5 rounded-md ${iconBg} flex-shrink-0`}>
          <Icon className="h-4 w-4" />
        </span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium truncate">{title}</h4>
            <Badge variant="secondary" className="text-xs">
              {BLOCK_TYPE_LABELS[block.type || 'content']}
            </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <div className={cn(
              "transition-all duration-200",
              isExpanded ? "" : "line-clamp-2"
            )}>
              {content}
            </div>
            
            {content.length > 100 && (
              <button
                onClick={() => onToggleExpand(block.id)}
                className="text-primary hover:underline mt-1"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Available Block Component
function AvailableBlockCard({ block, isDark, onAdd }: {
  block: Block;
  isDark: boolean;
  onAdd: (block: Block) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = getBlockTypeIcon(block.type);
  const cardColors = getBlockTypeColors(block.type, isDark);
  const iconBg = getBlockIconColors(block.type, isDark);
  const title = typeof block.title === 'string' ? block.title : block.title?.en || 'Untitled';
  const content = typeof block.content === 'string' ? block.content : block.content.en || '';

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] group",
        cardColors
      )}
      onClick={() => onAdd(block)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className={`p-2 rounded-lg ${iconBg} flex-shrink-0`}>
            <Icon className="h-5 w-5" />
          </span>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm truncate">{title}</h3>
              <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
            </div>
            
            <Badge variant="outline" className="mb-2 text-xs">
              {BLOCK_TYPE_LABELS[block.type || 'content']}
            </Badge>
            
            <div className="text-xs text-muted-foreground">
              <div className={cn(
                "transition-all duration-200",
                isExpanded ? "" : "line-clamp-3"
              )}>
                {content}
              </div>
              
              {content.length > 150 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="text-primary hover:underline mt-1"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Preview Block Component
function PreviewBlock({ block, isDark }: { block: Block; isDark: boolean }) {
  const Icon = getBlockTypeIcon(block.type);
  const iconBg = getBlockIconColors(block.type, isDark);
  const title = typeof block.title === 'string' ? block.title : block.title?.en || 'Untitled';
  const content = typeof block.content === 'string' ? block.content : block.content.en || '';

  return (
    <div className="border rounded-lg p-4 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className={`p-1 rounded ${iconBg}`}>
          <Icon className="h-3 w-3" />
        </span>
        <span className="text-sm font-medium">{title}</span>
        <Badge variant="outline" className="text-xs">
          {BLOCK_TYPE_LABELS[block.type || 'content']}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground pl-6">
        {buildPromptPart(block.type || 'content', content)}
      </div>
    </div>
  );
}

export const InsertBlockDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.INSERT_BLOCK);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState<Block[]>([]);
  const [search, setSearch] = useState('');
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set());
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [previewMode, setPreviewMode] = useState<'visual' | 'text'>('visual');
  const isDark = useThemeDetector();

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSelectedBlocks([]);
      setSearch('');
      setSelectedTypeFilter('all');
      blocksApi.getBlocks().then(res => {
        if (res.success) {
          setBlocks(res.data);
        } else {
          setBlocks([]);
        }
        setLoading(false);
      });
    }
  }, [isOpen]);

  const addBlock = (block: Block) => {
    if (!selectedBlocks.find(b => b.id === block.id)) {
      setSelectedBlocks(prev => [...prev, block]);
    }
  };

  const removeBlock = (blockId: number) => {
    setSelectedBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  const insertBlocks = () => {
    const parts = selectedBlocks.map(b => {
      const content = typeof b.content === 'string' ? b.content : b.content.en || '';
      return buildPromptPart(b.type || 'content', content);
    });
    insertIntoPromptArea(parts.join('\n\n'));
    dialogProps.onOpenChange(false);
  };

  const handleCreate = () => {
    window.dialogManager?.openDialog(DIALOG_TYPES.CREATE_BLOCK, {
      onBlockCreated: (b: Block) => addBlock(b)
    });
  };

  // Filter blocks based on search and type
  const filteredBlocks = blocks.filter(b => {
    const title = typeof b.title === 'string' ? b.title : b.title?.en || '';
    const content = typeof b.content === 'string' ? b.content : b.content.en || '';
    const term = search.toLowerCase();
    const matchesSearch = title.toLowerCase().includes(term) || content.toLowerCase().includes(term);
    const matchesType = selectedTypeFilter === 'all' || b.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  // Get unique block types for filter
  const blockTypes = Array.from(new Set(blocks.map(b => b.type || 'content')));

  const toggleExpanded = (id: number) => {
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveBlockId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlockId(null);

    if (over && active.id !== over.id) {
      setSelectedBlocks((blocks) => {
        const oldIndex = blocks.findIndex(b => b.id === active.id);
        const newIndex = blocks.findIndex(b => b.id === over.id);
        return arrayMove(blocks, oldIndex, newIndex);
      });
    }
  };

  const generateFullPrompt = () => {
    return selectedBlocks.map(b => {
      const content = typeof b.content === 'string' ? b.content : b.content.en || '';
      return buildPromptPart(b.type || 'content', content);
    }).join('\n\n');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateFullPrompt());
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title="Build Your Prompt"
      description="Select and arrange blocks to create your perfect prompt"
      className="jd-max-w-6xl jd-max-h-[90vh]"
    >
      <div className="jd-flex jd-h-full jd-gap-6">
        {/* Left Panel - Block Library */}
        <div className="jd-flex-1 jd-flex jd-flex-col jd-min-w-0">
          <div className="jd-space-y-4 jd-mb-4">
            {/* Search and Filter */}
            <div className="jd-flex jd-gap-2">
              <div className="jd-relative jd-flex-1">
                <Search className="jd-absolute jd-left-3 jd-top-1/2 jd-transform jd--translate-y-1/2 jd-h-4 jd-w-4 jd-text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search blocks..."
                  className="jd-pl-9"
                />
              </div>
              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                className="jd-px-3 jd-py-2 jd-border jd-rounded-md jd-bg-background jd-text-sm"
              >
                <option value="all">All Types</option>
                {blockTypes.map(type => (
                  <option key={type} value={type}>
                    {BLOCK_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            {/* Stats */}
            <div className="jd-flex jd-items-center jd-gap-4 jd-text-sm jd-text-muted-foreground">
              <span>{filteredBlocks.length} blocks available</span>
              {selectedBlocks.length > 0 && (
                <>
                  <ArrowRight className="jd-h-3 jd-w-3" />
                  <span className="jd-text-primary">{selectedBlocks.length} selected</span>
                </>
              )}
            </div>
          </div>

          {/* Available Blocks */}
          <ScrollArea className="jd-flex-1">
            <div className="jd-space-y-3 jd-pr-4">
              {loading ? (
                <LoadingSpinner size="sm" message="Loading blocks..." />
              ) : filteredBlocks.length === 0 ? (
                <EmptyMessage>
                  {search ? `No blocks found for "${search}"` : 'No blocks available'}
                </EmptyMessage>
              ) : (
                filteredBlocks.map(block => (
                  <AvailableBlockCard
                    key={block.id}
                    block={block}
                    isDark={isDark}
                    onAdd={addBlock}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Selected Blocks & Preview */}
        <div className="jd-w-1/2 jd-flex jd-flex-col">
          <Tabs defaultValue="builder" className="jd-flex-1 jd-flex jd-flex-col">
            <TabsList className="jd-grid jd-w-full jd-grid-cols-2">
              <TabsTrigger value="builder" className="jd-flex jd-items-center jd-gap-2">
                <Sparkles className="jd-h-4 jd-w-4" />
                Builder
              </TabsTrigger>
              <TabsTrigger value="preview" className="jd-flex jd-items-center jd-gap-2">
                <Eye className="jd-h-4 jd-w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="jd-flex-1 jd-flex jd-flex-col jd-mt-4">
              <div className="jd-flex jd-items-center jd-justify-between jd-mb-4">
                <h3 className="jd-text-sm jd-font-medium">Selected Blocks</h3>
                {selectedBlocks.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBlocks([])}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {selectedBlocks.length === 0 ? (
                <div className="jd-flex-1 jd-flex jd-items-center jd-justify-center jd-border-2 jd-border-dashed jd-border-muted jd-rounded-lg">
                  <div className="jd-text-center jd-text-muted-foreground">
                    <Sparkles className="jd-h-8 jd-w-8 jd-mx-auto jd-mb-2 jd-opacity-50" />
                    <p className="jd-text-sm">Select blocks to start building</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="jd-flex-1">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={selectedBlocks.map(b => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="jd-space-y-3 jd-pr-4">
                        {selectedBlocks.map(block => (
                          <SortableSelectedBlock
                            key={block.id}
                            block={block}
                            isDark={isDark}
                            onRemove={removeBlock}
                            isExpanded={expandedBlocks.has(block.id)}
                            onToggleExpand={toggleExpanded}
                          />
                        ))}
                      </div>
                    </SortableContext>

                    <DragOverlay>
                      {activeBlockId ? (
                        <div className="jd-bg-background jd-border jd-rounded-lg jd-p-3 jd-shadow-lg jd-opacity-95">
                          Dragging block...
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="preview" className="jd-flex-1 jd-flex jd-flex-col jd-mt-4">
              <div className="jd-flex jd-items-center jd-justify-between jd-mb-4">
                <h3 className="jd-text-sm jd-font-medium">Prompt Preview</h3>
                <div className="jd-flex jd-items-center jd-gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    disabled={selectedBlocks.length === 0}
                  >
                    <Copy className="jd-h-4 jd-w-4 jd-mr-1" />
                    Copy
                  </Button>
                  <div className="jd-flex jd-bg-muted jd-rounded-md jd-p-1">
                    <button
                      onClick={() => setPreviewMode('visual')}
                      className={cn(
                        "jd-px-2 jd-py-1 jd-text-xs jd-rounded jd-transition-colors",
                        previewMode === 'visual' ? "jd-bg-background jd-shadow-sm" : "jd-hover:bg-background/50"
                      )}
                    >
                      <Eye className="jd-h-3 jd-w-3" />
                    </button>
                    <button
                      onClick={() => setPreviewMode('text')}
                      className={cn(
                        "jd-px-2 jd-py-1 jd-text-xs jd-rounded jd-transition-colors",
                        previewMode === 'text' ? "jd-bg-background jd-shadow-sm" : "jd-hover:bg-background/50"
                      )}
                    >
                      <Code className="jd-h-3 jd-w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {selectedBlocks.length === 0 ? (
                <div className="jd-flex-1 jd-flex jd-items-center jd-justify-center jd-border-2 jd-border-dashed jd-border-muted jd-rounded-lg">
                  <div className="jd-text-center jd-text-muted-foreground">
                    <Eye className="jd-h-8 jd-w-8 jd-mx-auto jd-mb-2 jd-opacity-50" />
                    <p className="jd-text-sm">Preview will appear here</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="jd-flex-1">
                  <div className="jd-space-y-4 jd-pr-4">
                    {previewMode === 'visual' ? (
                      selectedBlocks.map(block => (
                        <PreviewBlock key={block.id} block={block} isDark={isDark} />
                      ))
                    ) : (
                      <div className="jd-bg-muted/30 jd-rounded-lg jd-p-4">
                        <pre className="jd-text-sm jd-whitespace-pre-wrap jd-font-mono">
                          {generateFullPrompt()}
                        </pre>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="jd-flex jd-justify-between jd-pt-4 jd-border-t jd-mt-4">
            <Button variant="outline" onClick={() => dialogProps.onOpenChange(false)}>
              Cancel
            </Button>
            <div className="jd-flex jd-gap-2">
              <Button variant="secondary" onClick={handleCreate}>
                <Plus className="jd-h-4 jd-w-4 jd-mr-1" />
                Create Block
              </Button>
              <Button 
                disabled={selectedBlocks.length === 0} 
                onClick={insertBlocks}
                className="jd-bg-gradient-to-r jd-from-blue-600 jd-to-purple-600 hover:jd-from-blue-700 hover:jd-to-purple-700"
              >
                <Sparkles className="jd-h-4 jd-w-4 jd-mr-1" />
                Insert Prompt ({selectedBlocks.length})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};