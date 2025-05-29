import React, { useEffect, useState } from 'react';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { blocksApi } from '@/services/api/BlocksApi';
import { Block } from '@/types/prompts/blocks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyMessage } from '@/components/panels/TemplatesPanel/EmptyMessage';
import {
  getBlockTypeIcon,
  getBlockTypeColors,
  getBlockIconColors,
  buildPromptPart
} from '@/components/prompts/blocks/blockUtils';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { insertIntoPromptArea } from '@/utils/templates/placeholderUtils';

export const InsertBlockDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.INSERT_BLOCK);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState<Block[]>([]);
  const [showList, setShowList] = useState(false);
  const [search, setSearch] = useState('');
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const isDark = useThemeDetector();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSelectedBlocks([]);
      setShowList(false);
      setSearch('');
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
    setSelectedBlocks(prev => [...prev, block]);
    setShowList(false);
  };

  const insertBlocks = () => {
    const parts = selectedBlocks.map(b => {
      const content = typeof b.content === 'string' ? b.content : b.content.en || '';
      return buildPromptPart(b.type, content);
    });
    insertIntoPromptArea(parts.join('\n\n'));
    dialogProps.onOpenChange(false);
  };

  const handleCreate = () => {
    window.dialogManager?.openDialog(DIALOG_TYPES.CREATE_BLOCK, {
      onBlockCreated: (b: Block) => addBlock(b)
    });
  };

  if (!isOpen) return null;

  const filtered = blocks.filter(b => {
    const title = typeof b.title === 'string' ? b.title : b.title?.en || '';
    const content = typeof b.content === 'string' ? b.content : b.content.en || '';
    const term = search.toLowerCase();
    return title.toLowerCase().includes(term) || content.toLowerCase().includes(term);
  });

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title="Insert Blocks"
      className="jd-max-w-lg"
    >
      <div className="jd-space-y-4">
        {/* Selected blocks placeholder */}
        {selectedBlocks.length === 0 ? (
          <div className="jd-text-center jd-text-sm jd-text-muted-foreground">
            <Button variant="outline" onClick={() => setShowList(true)}>Add Block</Button>
          </div>
        ) : (
          <div className="jd-space-y-2">
            {selectedBlocks.map(b => {
              const Icon = getBlockTypeIcon(b.type);
              const iconBg = getBlockIconColors(b.type, isDark);
              const title = typeof b.title === 'string' ? b.title : b.title?.en || 'Untitled';
              const content = typeof b.content === 'string' ? b.content : b.content.en || '';
              return (
                <div
                  key={b.id}
                  className="jd-flex jd-gap-2 jd-items-start jd-border jd-rounded jd-p-2 jd-bg-background"
                  draggable
                  onDragStart={() => setDraggedId(b.id)}
                  onDragOver={e => {e.preventDefault(); if (draggedId!==null) {
                    const from = selectedBlocks.findIndex(bl => bl.id===draggedId);
                    const to = selectedBlocks.findIndex(bl => bl.id===b.id);
                    if (from!==-1 && to!==-1 && from!==to){
                      const arr=[...selectedBlocks];
                      const [m]=arr.splice(from,1);
                      arr.splice(to,0,m);
                      setSelectedBlocks(arr);
                    }
                  }}}
                  onDragEnd={() => setDraggedId(null)}
                >
                  <span className={`jd-p-1 jd-rounded ${iconBg}`}><Icon className="jd-h-4 jd-w-4" /></span>
                  <div className="jd-flex-1">
                    <div className="jd-text-sm jd-font-medium">{title}</div>
                    <div className={`jd-text-xs jd-text-muted-foreground ${expanded.has(b.id) ? '' : 'jd-line-clamp-1'}`}>{content}</div>
                    {content.length > 60 && (
                      <button type="button" className="jd-text-xs jd-text-primary" onClick={() => toggleExpand(b.id)}>
                        {expanded.has(b.id) ? 'See less' : 'See more'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="jd-text-center">
              <Button variant="outline" size="sm" onClick={() => setShowList(true)}>Add another block</Button>
            </div>
          </div>
        )}

        {/* Block list */}
        {showList && (
          <div className="jd-space-y-2 jd-border-t jd-pt-4">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search blocks..."
              className="jd-h-8"
            />
            <div className="jd-max-h-48 jd-overflow-y-auto jd-space-y-2">
              {loading ? (
                <LoadingSpinner size="sm" message="Loading blocks..." />
              ) : filtered.length === 0 ? (
                <EmptyMessage>No blocks found</EmptyMessage>
              ) : (
                filtered.map(block => {
                  const Icon = getBlockTypeIcon(block.type);
                  const cardColors = getBlockTypeColors(block.type, isDark);
                  const iconBg = getBlockIconColors(block.type, isDark);
                  const title = typeof block.title === 'string' ? block.title : block.title?.en || 'Untitled';
                  const content = typeof block.content === 'string' ? block.content : block.content.en || '';
                  return (
                    <Card key={block.id} className={`jd-cursor-pointer ${cardColors} jd-border`} onClick={() => addBlock(block)}>
                      <CardContent className="jd-flex jd-items-start jd-gap-2 jd-p-2">
                        <span className={`jd-p-1 jd-rounded ${iconBg}`}><Icon className="jd-h-4 jd-w-4" /></span>
                        <div className="jd-flex-1">
                          <div className="jd-text-sm jd-font-medium jd-truncate">{title}</div>
                          <div className={`jd-text-xs jd-text-muted-foreground ${expanded.has(block.id) ? '' : 'jd-line-clamp-1'}`}>{content}</div>
                          {content.length > 60 && (
                            <button type="button" className="jd-text-xs jd-text-primary" onClick={e => {e.stopPropagation(); toggleExpand(block.id);}}>
                              {expanded.has(block.id) ? 'See less' : 'See more'}
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="jd-flex jd-justify-between jd-pt-4">
        <Button variant="outline" onClick={() => dialogProps.onOpenChange(false)}>Close</Button>
        <div className="jd-flex jd-gap-2">
          <Button variant="secondary" onClick={handleCreate}>Create Block</Button>
          <Button disabled={selectedBlocks.length===0} onClick={insertBlocks}>Insert</Button>
        </div>
      </div>
    </BaseDialog>
  );
};
