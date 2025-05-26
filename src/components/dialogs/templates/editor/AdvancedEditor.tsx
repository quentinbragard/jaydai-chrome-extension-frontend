// src/components/dialogs/templates/editor/AdvancedEditor.tsx
import React, { useState, useEffect } from 'react';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { BlockSidebar } from './BlockSidebar';
import { BlockDetailEditor } from './BlockDetailEditor';
import { PreviewPanel } from './PreviewPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

interface AdvancedEditorProps {
  blocks: Block[];
  onAddBlock: (position: 'start' | 'end', blockType: BlockType, existingBlock?: Block) => void;
  onRemoveBlock: (blockId: number) => void;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onMoveBlock: (blockId: number, direction: 'up' | 'down') => void;
  isProcessing: boolean;
}

/**
 * Advanced editor mode - displays blocks in a sidebar on the left with detailed editing on the right
 */
export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  blocks,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onMoveBlock,
  isProcessing
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(
    blocks.length > 0 ? blocks[0].id : null
  );
  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor');

  const selectedBlock = blocks.find(block => block.id === selectedBlockId);

  // Update selected block when blocks change
  useEffect(() => {
    if (blocks.length > 0 && !blocks.find(block => block.id === selectedBlockId)) {
      setSelectedBlockId(blocks[0].id);
    } else if (blocks.length === 0) {
      setSelectedBlockId(null);
    }
  }, [blocks, selectedBlockId]);

  // Handle block selection
  const handleBlockSelect = (blockId: number) => {
    setSelectedBlockId(blockId);
    setActiveView('editor');
  };

  // Handle block addition with auto-selection
  const handleAddBlock = (position: 'start' | 'end', blockType: BlockType, existingBlock?: Block) => {
    // Create a temporary ID for the new block
    const tempId = Date.now() + Math.random();
    
    // Call the parent's add block function
    onAddBlock(position, blockType, existingBlock);
    
    // Use a timeout to wait for the block to be added to the array
    setTimeout(() => {
      // Find the newest block (highest ID) since we can't predict the exact ID
      const sortedBlocks = [...blocks].sort((a, b) => b.id - a.id);
      if (sortedBlocks.length > 0) {
        const newestBlock = sortedBlocks[0];
        // Only select if it's actually new (different from current selection)
        if (newestBlock.id !== selectedBlockId) {
          setSelectedBlockId(newestBlock.id);
          setActiveView('editor');
        }
      }
    }, 100);
  };

  // Handle block removal with smart selection
  const handleRemoveBlock = (blockId: number) => {
    if (blocks.length <= 1) return;
    
    const blockIndex = blocks.findIndex(block => block.id === blockId);
    const wasSelected = blockId === selectedBlockId;
    
    onRemoveBlock(blockId);
    
    // If we removed the selected block, select another one
    if (wasSelected) {
      setTimeout(() => {
        const remainingBlocks = blocks.filter(block => block.id !== blockId);
        if (remainingBlocks.length > 0) {
          // Select the block at the same index, or the last one if we removed the last block
          const newIndex = Math.min(blockIndex, remainingBlocks.length - 1);
          setSelectedBlockId(remainingBlocks[newIndex].id);
        }
      }, 100);
    }
  };

  return (
    <div className="jd-flex jd-h-full jd-gap-4">
      <ResizablePanelGroup direction="horizontal" className="jd-min-h-0">
        {/* Left Sidebar - Block List */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <BlockSidebar
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            onBlockSelect={handleBlockSelect}
            onAddBlock={handleAddBlock}
            onRemoveBlock={handleRemoveBlock}
            onMoveBlock={onMoveBlock}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Right Content Area */}
        <ResizablePanel defaultSize={70} minSize={60}>
          <div className="jd-flex jd-flex-col jd-h-full">
            {/* Tab Controls */}
            <div className="jd-flex jd-border-b jd-mb-4">
              <button
                onClick={() => setActiveView('editor')}
                className={`jd-px-4 jd-py-2 jd-font-medium jd-text-sm jd-border-b-2 jd-transition-colors ${
                  activeView === 'editor'
                    ? 'jd-border-primary jd-text-primary'
                    : 'jd-border-transparent jd-text-muted-foreground hover:jd-text-foreground'
                }`}
              >
                Edit Block
              </button>
              <button
                onClick={() => setActiveView('preview')}
                className={`jd-px-4 jd-py-2 jd-font-medium jd-text-sm jd-border-b-2 jd-transition-colors ${
                  activeView === 'preview'
                    ? 'jd-border-primary jd-text-primary'
                    : 'jd-border-transparent jd-text-muted-foreground hover:jd-text-foreground'
                }`}
              >
                Preview
              </button>
            </div>
            
            {/* Content Area */}
            <div className="jd-flex-1 jd-overflow-hidden">
              {activeView === 'editor' ? (
                selectedBlock ? (
                  <BlockDetailEditor
                    block={selectedBlock}
                    onUpdateBlock={onUpdateBlock}
                  />
                ) : (
                  <div className="jd-flex jd-items-center jd-justify-center jd-h-full jd-text-muted-foreground">
                    <div className="jd-text-center">
                      <p className="jd-text-lg jd-mb-2">No block selected</p>
                      <p className="jd-text-sm">Select a block from the sidebar to start editing</p>
                    </div>
                  </div>
                )
              ) : (
                <PreviewPanel blocks={blocks} />
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};