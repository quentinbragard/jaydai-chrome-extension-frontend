import React, { useEffect, useState, useCallback } from 'react';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { blocksApi } from '@/services/api/BlocksApi';
import { Block, BlockType } from '@/types/prompts/blocks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyMessage } from '@/components/panels/TemplatesPanel/EmptyMessage';
import {
  buildPromptPart,
  buildPromptPartHtml,
  BLOCK_TYPE_LABELS,
  getBlockTypeIcon,
  getBlockIconColors,
  BLOCK_TYPES
} from '@/utils/prompts/blockUtils';
import EditablePromptPreview from '@/components/prompts/EditablePromptPreview';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { useDialogActions } from '@/hooks/dialogs/useDialogActions';
import { useBlockActions } from '@/hooks/prompts/actions/useBlockActions';
import { insertIntoPromptArea } from '@/utils/templates/placeholderUtils';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { trackEvent, EVENTS } from '@/utils/amplitude';

import { 
  Search,
  Plus,
  Eye,
  Code,
  Sparkles,
  Copy,
  Filter,
  X,
  Lightbulb,
  Save,
  Info,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';

import { SortableSelectedBlock } from './SortableSelectedBlock';
import { AvailableBlockCard } from './AvailableBlockCard';
import { detectPlatform } from '@/platforms/platformManager';

// Metadata type groups for filtering
const METADATA_FILTERS = [
  { type: 'role', label: getMessage('role', undefined, 'Role'), icon: '👤' },
  { type: 'context', label: getMessage('context', undefined, 'Context'), icon: '📝' },
  { type: 'goal', label: getMessage('goal', undefined, 'Goal'), icon: '🎯' },
  { type: 'tone_style', label: getMessage('tone_style', undefined, 'Tone'), icon: '🎨' },
  { type: 'audience', label: getMessage('audience', undefined, 'Audience'), icon: '👥' },
  { type: 'output_format', label: getMessage('output_format', undefined, 'Format'), icon: '📋' },
  { type: 'constraint', label: getMessage('constraint', undefined, 'Constraint'), icon: '🚫' },
  { type: 'example', label: getMessage('example', undefined, 'Example'), icon: '💡' },
  { type: 'custom', label: getMessage('custom', undefined, 'Custom'), icon: '🔧' },
] as const;

// Inline block creation component
const InlineBlockCreator: React.FC<{
  onBlockCreated: (block: Block) => void;
  onCancel: () => void;
}> = ({ onBlockCreated, onCancel }) => {
  const [type, setType] = useState<BlockType>('custom');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const isDark = useThemeDetector();

  const handleCreate = async () => {
    if (!content.trim()) {
      toast.error(getMessage('blockContentRequired', undefined, 'Block content is required'));
      return;
    }

    setIsCreating(true);
    try {
      const blockData = {
        type,
        content: content.trim(),
        title: title.trim() || `${BLOCK_TYPE_LABELS[type]} Block`,
      };
      
      const response = await blocksApi.createBlock(blockData);

      if (response.success && response.data) {
        toast.success(getMessage('blockCreated', undefined, 'Block created successfully'));
        trackEvent(EVENTS.BLOCK_CREATED, {
          block_id: response.data.id,
          block_type: response.data.type,
          source: 'InsertBlockDialog'
        });
        onBlockCreated(response.data);
      } else {
        toast.error(response.message || getMessage('blockCreateFailed', undefined, 'Failed to create block'));
      }
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error(getMessage('blockCreateError', undefined, 'An error occurred while creating the block'));
    } finally {
      setIsCreating(false);
    }
  };


  const Icon = getBlockTypeIcon(type);
  const iconBg = getBlockIconColors(type, isDark);

  return (
    <div className="jd-border jd-rounded-lg jd-p-4 jd-bg-muted/20 jd-space-y-3">
      <div className="jd-flex jd-items-center jd-gap-2 jd-mb-3">
        <div className={cn('jd-p-1.5 jd-rounded-md', iconBg)}>
          <Icon className="jd-h-4 jd-w-4" />
        </div>
        <h3 className="jd-font-medium jd-text-sm">
          {getMessage('createNewBlock', undefined, 'Create New Block')}
        </h3>
      </div>

      <div className="jd-space-y-3">
        <div>
          <label className="jd-text-xs jd-font-medium jd-mb-1 jd-block">
            {getMessage('type', undefined, 'Type')}
          </label>
          <Select value={type} onValueChange={(value) => setType(value as BlockType)}>
            <SelectTrigger className="jd-h-8 jd-text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="jd-z-[10010]">
              {BLOCK_TYPES.map((blockType) => {
                const TypeIcon = getBlockTypeIcon(blockType);
                return (
                  <SelectItem key={blockType} value={blockType}>
                    <div className="jd-flex jd-items-center jd-gap-2">
                      <TypeIcon className="jd-h-3 jd-w-3" />
                      {BLOCK_TYPE_LABELS[blockType]}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="jd-text-xs jd-font-medium jd-mb-1 jd-block">
            {getMessage('titleOptional', undefined, 'Title (optional)')}
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`${BLOCK_TYPE_LABELS[type]} Block`}
            className="jd-h-8 jd-text-xs"
            onKeyDown={(e) => e.stopPropagation()}
            onKeyPress={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
          />
        </div>

        <div>
          <label className="jd-text-xs jd-font-medium jd-mb-1 jd-block">
            {getMessage('content', undefined, 'Content')}
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={getMessage('enterBlockContent', [type], `Enter ${type} content...`)}
            className="jd-min-h-[80px] jd-text-xs jd-resize-none"
            rows={4}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyPress={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
          />
        </div>

        <div className="jd-flex jd-gap-2 jd-pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={isCreating}
            className="jd-flex-1 jd-h-8 jd-text-xs"
          >
            <X className="jd-h-3 jd-w-3 jd-mr-1" />
            {getMessage('cancel', undefined, 'Cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={isCreating || !content.trim()}
            className="jd-flex-1 jd-h-8 jd-text-xs"
          >
            {isCreating ? (
              <>
                <div className="jd-h-3 jd-w-3 jd-border jd-border-current jd-border-t-transparent jd-animate-spin jd-rounded-full jd-mr-1"></div>
                {getMessage('creating', undefined, 'Creating...')}
              </>
            ) : (
              <>
                <Save className="jd-h-3 jd-w-3 jd-mr-1" />
                {getMessage('create', undefined, 'Create')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};


export const InsertBlockDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.INSERT_BLOCK);
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        trackEvent(EVENTS.INSERT_BLOCK_DIALOG_CLOSED);
      }
      dialogProps.onOpenChange(open);
    },
    [dialogProps]
  );
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState<Block[]>([]);
  const [search, setSearch] = useState('');
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set());
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [previewMode, setPreviewMode] = useState<'visual' | 'text'>('text');
  const [showInlineCreator, setShowInlineCreator] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [blockContents, setBlockContents] = useState<Record<number, string>>({});
  const isDark = useThemeDetector();
  const { openCreateBlock } = useDialogActions();
  const { editBlock, deleteBlock } = useBlockActions({
    onBlockUpdated: (updated) => {
      setBlocks(prev => prev.map(b => (b.id === updated.id ? updated : b)));
      setSelectedBlocks(prev => prev.map(b => (b.id === updated.id ? updated : b)));
      setBlockContents(prev => {
        if (prev.hasOwnProperty(updated.id)) {
          const content = typeof updated.content === 'string' ? updated.content : updated.content?.en || '';
          return { ...prev, [updated.id]: content };
        }
        return prev;
      });
    },
    onBlockDeleted: (id) => {
      setBlocks(prev => prev.filter(b => b.id !== id));
      setSelectedBlocks(prev => prev.filter(b => b.id !== id));
      setBlockContents(prev => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
    }
  });
  const platform = detectPlatform();


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
      trackEvent(EVENTS.INSERT_BLOCK_DIALOG_OPENED);
      setLoading(true);
      setSelectedBlocks([]);
      setBlockContents({});
      setSearch('');
      setSelectedTypeFilter('all');
      setShowInlineCreator(false);
      blocksApi.getBlocks().then(res => {
        if (res.success) {
          const published = res.data.filter(
            b => (b as any).published
          );
          setBlocks(published);
        } else {
          setBlocks([]);
        }
        setLoading(false);
      });
    }
  }, [isOpen]);

  // Update editable content when selected blocks or their text change
  useEffect(() => {
    const parts = selectedBlocks.map(b => {
      const text = blockContents[b.id] ?? (typeof b.content === 'string' ? b.content : b.content.en || '');
      return buildPromptPart(b.type || 'custom', text);
    });
    setEditableContent(parts.join('\n\n'));
  }, [selectedBlocks, blockContents]);

  // Generate HTML content from the editable text so that updates made by the
  // user are reflected in the preview when they exit the editor.
  const generateFullPromptHtml = useCallback(() => {
    return selectedBlocks
      .map(b => {
        const text = blockContents[b.id] ?? (typeof b.content === 'string' ? b.content : b.content.en || '');
        return buildPromptPartHtml(b.type || 'custom', text, isDark);
      })
      .join('<br><br>');
  }, [selectedBlocks, blockContents, isDark]);


  const addBlock = (block: Block) => {
    if (!selectedBlocks.find(b => b.id === block.id)) {
      setSelectedBlocks(prev => [...prev, block]);
      const content = typeof block.content === 'string' ? block.content : block.content.en || '';
      setBlockContents(prev => ({ ...prev, [block.id]: content }));
      trackEvent(EVENTS.INSERT_BLOCK_DIALOG_BLOCK_SELECTED, { block_id: block.id, block_type: block.type });
    }
  };

  const removeBlock = (block: Block) => {
    setSelectedBlocks(prev => prev.filter(b => b.id !== block.id));
    setBlockContents(prev => {
      const { [block.id]: _removed, ...rest } = prev;
      return rest;
    });
    trackEvent(EVENTS.INSERT_BLOCK_DIALOG_BLOCK_UNSELECTED, { block_id: block.id, block_type: block.type });
  };

  const handleEditableContentChange = (text: string) => {
    const segments = text.split(/\n{2,}/);
    setBlockContents(prev => {
      const updated = { ...prev };
      selectedBlocks.forEach((b, idx) => {
        let seg = segments[idx] ?? '';
        const prefix = buildPromptPart(b.type || 'custom', '');
        if (prefix && seg.startsWith(prefix)) {
          seg = seg.slice(prefix.length);
        }
        updated[b.id] = seg;
      });
      return updated;
    });
    setEditableContent(text);
  };

  const insertBlocks = () => {
    // Use the editable content which might have been modified by the user
    insertIntoPromptArea(editableContent);
    trackEvent(EVENTS.INSERT_BLOCK_DIALOG_BLOCKS_INSERTED, { count: selectedBlocks.length });
    handleOpenChange(false);
    toast.success(getMessage('promptInserted', undefined, 'Prompt inserted successfully'));
  };

  const handleCreate = () => {
    setShowInlineCreator(true);
  };

  const handleBlockCreated = (newBlock: Block) => {
    setBlocks(prev => [newBlock, ...prev]);
    addBlock(newBlock);
    setShowInlineCreator(false);
  };

  const handleEditBlock = (block: Block) => {
    trackEvent(EVENTS.INSERT_BLOCK_DIALOG_BLOCK_UPDATED, { block_id: block.id, block_type: block.type });
    editBlock(block);
  };

  const handleDeleteBlock = (block: Block) => {
    trackEvent(EVENTS.INSERT_BLOCK_DIALOG_BLOCK_DELETED, { block_id: block.id, block_type: block.type });
    deleteBlock(block);
  };

// Filter blocks based on search, type, and published status
const filteredBlocks = blocks.filter(b => {
  const title = typeof b.title === 'string' ? b.title : b.title?.en || '';
  const content = typeof b.content === 'string' ? b.content : b.content.en || '';
  const term = search.toLowerCase();
  const matchesSearch = title.toLowerCase().includes(term) || content.toLowerCase().includes(term);
  const matchesType = selectedTypeFilter === 'all' || b.type === selectedTypeFilter;
  const isPublished = (b as any).published;
  return matchesSearch && matchesType && isPublished;
});

  // Get unique block types for filter
  const blockTypes = Array.from(new Set(blocks.map(b => b.type || 'custom')));

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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editableContent);
      toast.success(getMessage('copiedToClipboard', undefined, 'Copied to clipboard'));
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!isOpen) return null;

  console.log("platform", platform);

  const footer = (
    <div className="jd-flex jd-justify-between">
      <Button variant="outline" onClick={() => handleOpenChange(false)}>
        {getMessage('cancel', undefined, 'Cancel')}
      </Button>
      <div className="jd-flex jd-gap-2">
        <Button variant="secondary" onClick={handleCreate}>
          <Plus className="jd-h-4 jd-w-4 jd-mr-1" />
          {getMessage('createBlock', undefined, 'Create Block')}
        </Button>
        <Button
          disabled={selectedBlocks.length === 0}
          onClick={insertBlocks}
          className="jd-bg-gradient-to-r jd-from-blue-600 jd-to-purple-600 hover:jd-from-blue-700 hover:jd-to-purple-700"
        >
          <Sparkles className="jd-h-4 jd-w-4 jd-mr-1" />
          {getMessage('insertPrompt', undefined, 'Insert Prompt')} ({selectedBlocks.length})
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <BaseDialog
        open={isOpen}
        onOpenChange={handleOpenChange}
        title={getMessage('buildYourPrompt', undefined, 'Build Your Prompt')}
        description={getMessage('buildYourPromptDesc', undefined, 'Select and arrange blocks to create your perfect prompt')}
        className="jd-max-w-7xl"
        footer={footer}
      >
      <div className="jd-flex jd-items-center jd-text-xs jd-text-muted-foreground jd-mb-2 jd-gap-2">
        <Info className="jd-w-4 jd-h-4 jd-text-primary" />
        <span>
          {getMessage('insertBlockTip', undefined, 'Tip: type ')}
          <span className="jd-font-mono">//j</span>{' '}
          {getMessage('insertBlockTipContinuation', [platform], `in the prompt area to quickly add blocks on ${platform.toLowerCase()}.`)}
        </span>
        <button
          type="button"
          onClick={() => setShowShortcutHelp(true)}
          className="jd-ml-auto jd-flex jd-items-center jd-justify-center jd-w-5 jd-h-5 jd-rounded-full jd-bg-primary jd-text-primary-foreground hover:jd-bg-primary/90 jd-animate-bounce"
        >
          <HelpCircle className="jd-w-3 jd-h-3" />
          <span className="jd-sr-only">{getMessage('howItWorks', undefined, 'How it works')}</span>
        </button>
      </div>
      <div className="jd-flex jd-h-full jd-gap-6">
        {/* Left Panel - Block Library */}
        <div className="jd-flex-1 jd-flex jd-flex-col jd-min-w-0">
          <div className="jd-space-y-4 jd-mb-4">
            {/* Search */}
            <div className="jd-relative">
              <Search className="jd-absolute jd-left-3 jd-top-1/2 jd-transform jd--translate-y-1/2 jd-h-4 jd-w-4 jd-text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={getMessage('searchBlocksPlaceholder', undefined, 'Search blocks...')}
                className="jd-pl-9"
                onKeyDown={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
              />
            </div>

            {/* Quick Filters */}
            <div className="jd-space-y-2">
              <div className="jd-flex jd-items-center jd-gap-2 jd-text-xs jd-font-medium jd-text-muted-foreground">
                <Filter className="jd-h-3 jd-w-3" />
                {getMessage('quickFilters', undefined, 'Quick Filters')}
              </div>
              <div className="jd-flex jd-flex-wrap jd-gap-1">
                <Button
                  size="sm"
                  variant={selectedTypeFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedTypeFilter('all')}
                  className="jd-h-6 jd-text-xs jd-px-2"
                >
                  {getMessage('all', undefined, 'All')}
                </Button>
                {METADATA_FILTERS.map(filter => (
                  <Button
                    key={filter.type}
                    size="sm"
                    variant={selectedTypeFilter === filter.type ? 'default' : 'outline'}
                    onClick={() => setSelectedTypeFilter(filter.type)}
                    className="jd-h-6 jd-text-xs jd-px-2"
                  >
                    <span className="jd-mr-1">{filter.icon}</span>
                    {filter.label}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openCreateBlock({ source: 'InsertBlockDialog' })}
                  className="jd-h-6 jd-text-xs jd-px-2 jd-border-dashed"
                >
                  <Plus className="jd-h-3 jd-w-3 jd-mr-1" />
                  {getMessage('newBlock', undefined, 'New Block')}
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="jd-flex jd-items-center jd-gap-4 jd-text-sm jd-text-muted-foreground">
              <span className="jd-flex jd-items-center jd-gap-1">
                <Lightbulb className="jd-h-4 jd-w-4 jd-text-yellow-500" />
                {getMessage('aPerfectPrompt', undefined, 'A perfect prompt contains at least a role, context and goal')}
              </span>
            </div>
          </div>

          {/* Inline Block Creator */}
          {showInlineCreator && (
            <div className="jd-mb-4">
              <InlineBlockCreator
                onBlockCreated={handleBlockCreated}
                onCancel={() => setShowInlineCreator(false)}
              />
            </div>
          )}

          {/* Available Blocks */}
          <ScrollArea className="jd-h-[65vh]">
            <div className="jd-space-y-3 jd-pr-4">
              {loading ? (
                <LoadingSpinner size="sm" message={getMessage('loadingBlocks', undefined, 'Loading blocks...')} />
              ) : filteredBlocks.length === 0 ? (
                <EmptyMessage>
                  {search
                    ? getMessage('noBlocksFound', [search], `No blocks found for "${search}"`)
                    : getMessage('noBlocksAvailable', undefined, 'No blocks available')}
                </EmptyMessage>
              ) : (
                filteredBlocks.map(block => (
                  <AvailableBlockCard
                    key={block.id}
                    block={block}
                    isDark={isDark}
                    onAdd={addBlock}
                    onEdit={handleEditBlock}
                    onDelete={handleDeleteBlock}
                    isSelected={!!selectedBlocks.find(b => b.id === block.id)}
                    onRemove={removeBlock}
                    showActions={block.user_id ? true : false}
                  />
                )))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Selected Blocks & Preview */}
        <div className="jd-w-1/2 jd-flex jd-flex-col jd-max-h-full">
          <div className="jd-flex jd-items-center jd-justify-start jd-mb-4 jd-flex-shrink-0">
            <h3 className="jd-text-sm jd-font-medium">
              {getMessage('selectedBlocks', undefined, 'Selected Blocks')}
            </h3>
            <div className="jd-flex jd-items-center jd-gap-2 jd-ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={selectedBlocks.length === 0}
              >
                <Copy className="jd-h-4 jd-w-4 jd-mr-1" />
                {getMessage('copy', undefined, 'Copy')}
              </Button>
              <div className="jd-flex jd-bg-muted jd-rounded-md jd-p-1">
                <button
                  onClick={() => setPreviewMode('text')}
                  className={cn(
                    'jd-px-2 jd-py-1 jd-text-xs jd-rounded jd-transition-colors',
                    previewMode === 'text' ? 'jd-bg-background jd-shadow-sm' : 'jd-hover:bg-background/50'
                  )}
                >
                  <Code className="jd-h-3 jd-w-3" />
                </button>
                <button
                  onClick={() => setPreviewMode('visual')}
                  className={cn(
                    'jd-px-2 jd-py-1 jd-text-xs jd-rounded jd-transition-colors',
                    previewMode === 'visual' ? 'jd-bg-background jd-shadow-sm' : 'jd-hover:bg-background/50'
                  )}
                >
                  <Eye className="jd-h-3 jd-w-3" />
                </button>
              </div>
            </div>
          </div>

          {selectedBlocks.length === 0 ? (
            <div className="jd-flex jd-items-center jd-justify-center jd-border-2 jd-border-dashed jd-border-muted jd-rounded-lg jd-py-16 jd-flex-1">
              <div className="jd-text-center jd-text-muted-foreground">
                <Eye className="jd-h-8 jd-w-8 jd-mx-auto jd-mb-2 jd-opacity-50" />
                <p className="jd-text-sm jd-mb-1">
                  {getMessage('selectBlocksToBuild', undefined, 'Select blocks to build your prompt')}
                </p>
                <p className="jd-text-xs">
                  {getMessage('previewWillAppear', undefined, 'Preview will appear here with colors and placeholder highlighting')}
                </p>
              </div>
            </div>
          ) : (
            <div className="jd-flex-1 jd-min-h-0 jd-border-t jd-pt-4">
              {previewMode === 'visual' ? (
                <ScrollArea className="jd-h-[65vh]">
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={selectedBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                      <div className="jd-space-y-3 jd-pr-4">
                        {selectedBlocks.map(block => (
                          <SortableSelectedBlock
                            key={block.id}
                            block={block}
                            isDark={isDark}
                            onRemove={(id) => {
                              const blockToRemove = selectedBlocks.find(b => b.id === id);
                              if (blockToRemove) removeBlock(blockToRemove);
                            }}
                            isExpanded={expandedBlocks.has(block.id)}
                            onToggleExpand={toggleExpanded}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </ScrollArea>
              ) : (
                <div className="jd-h-full jd-flex jd-flex-col">
                  <div className="jd-flex jd-items-center jd-justify-between jd-mb-2">
                    <span className="jd-text-xs jd-text-muted-foreground">
                      {getMessage('editPromptPreview', undefined, 'Click to edit your prompt preview')}
                    </span>
                    <div className="jd-flex jd-items-center jd-gap-1 jd-text-xs jd-text-muted-foreground">
                      <span className="jd-inline-block jd-w-3 jd-h-3 jd-bg-yellow-300 jd-rounded"></span>
                      <span>{getMessage('placeholders', undefined, 'Placeholders')}</span>
                    </div>
                  </div>
                  <ScrollArea className="jd-h-full">
                    <div className="jd-pr-4">
                      <EditablePromptPreview
                        content={editableContent}
                        htmlContent={generateFullPromptHtml()}
                        onChange={handleEditableContentChange}
                        isDark={isDark}
                      />
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      </BaseDialog>
      {showShortcutHelp && (
        <BaseDialog
          open={showShortcutHelp}
          onOpenChange={setShowShortcutHelp}
          title={getMessage('usingShortcut', undefined, 'Using //j Shortcut')}
          className="jd-max-w-md"
        >
          <div className="jd-space-y-4">
            <p className="jd-text-sm">
              {getMessage('shortcutTipPrefix', undefined, 'Type ')}
              <span className="jd-font-mono">//j</span>{' '}
              {getMessage('shortcutTipSuffix', undefined, 'in the prompt area to open this block selector instantly.')}
            </p>
            <img
              src="https://vetoswvwgsebhxetqppa.supabase.co/storage/v1/object/public/images//shortchut_demo.gif"
              alt={getMessage('shortcutDemoAlt', undefined, 'Shortcut demonstration')}
              className="jd-w-full jd-rounded-md"
            />
          </div>
        </BaseDialog>
      )}
    </>
  );
};