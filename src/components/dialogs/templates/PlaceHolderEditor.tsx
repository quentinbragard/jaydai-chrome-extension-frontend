// src/components/dialogs/templates/PlaceHolderEditor.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useDialog } from '@/hooks/dialogs/useDialog';
import { BaseDialog } from '../BaseDialog';
import { getMessage, getCurrentLanguage } from '@/core/utils/i18n';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { toast } from "sonner";
import { Block, BlockType } from '@/components/templates/blocks/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicEditor, AdvancedEditor } from './editor';

/**
 * Enhanced dialog for editing template content using blocks with Basic/Advanced modes
 */
export const PlaceholderEditor: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog('placeholderEditor');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  // Helper function to extract content from potentially localized block content
  const getBlockContent = (block: Block): string => {
    if (typeof block.content === 'string') {
      return block.content;
    } else if (block.content && typeof block.content === 'object') {
      const locale = getCurrentLanguage();
      return block.content[locale] || block.content.en || Object.values(block.content)[0] || '';
    }
    return '';
  };

  // Initialize content and blocks when dialog opens
  useEffect(() => {
    if (isOpen && data) {
      setError(null);
      setIsProcessing(true);
      
      try {
        let templateBlocks: Block[] = [];
        
        // Process expanded blocks if available
        if (data.expanded_blocks && Array.isArray(data.expanded_blocks)) {
          templateBlocks = data.expanded_blocks.map((block: any, index: number) => ({
            id: block.id || Date.now() + index,
            type: block.type || 'content',
            content: block.content || '',
            name: block.name || `${(block.type || 'content').charAt(0).toUpperCase() + (block.type || 'content').slice(1)} Block`,
            description: block.description || ''
          }));
        } else if (data.content) {
          // If no blocks, create a default content block
          templateBlocks = [{
            id: Date.now(),
            type: 'content',
            content: data.content,
            name: 'Template Content'
          }];
        }
        
        setBlocks(templateBlocks);
      } catch (err) {
        console.error("Error processing template:", err);
        setError("Failed to process template content. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    }
  }, [isOpen, data]);

  // Handle adding a new block
  const handleAddBlock = (position: 'start' | 'end', blockType: BlockType, existingBlock?: Block) => {
    const newBlock: Block = existingBlock ? 
      { ...existingBlock, id: Date.now() + Math.random() } : 
      {
        id: Date.now() + Math.random(),
        type: blockType,
        content: '',
        name: `New ${blockType.charAt(0).toUpperCase() + blockType.slice(1)} Block`,
        description: ''
      };
    
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      if (position === 'start') {
        newBlocks.unshift(newBlock);
      } else {
        newBlocks.push(newBlock);
      }
      console.log('Added block:', newBlock, 'Total blocks:', newBlocks.length);
      return newBlocks;
    });
  };

  // Handle removing a block
  const handleRemoveBlock = (blockId: number) => {
    if (blocks.length <= 1) {
      toast.warning("Cannot remove the last block. Templates must have at least one block.");
      return;
    }
    
    setBlocks(prevBlocks => {
      const newBlocks = prevBlocks.filter(block => block.id !== blockId);
      console.log('Removed block:', blockId, 'Remaining blocks:', newBlocks.length);
      return newBlocks;
    });
  };

  // Handle updating block content
  const handleUpdateBlock = (blockId: number, updatedBlock: Partial<Block>) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === blockId ? { ...block, ...updatedBlock } : block
      )
    );
  };

  // Handle moving blocks
  const handleMoveBlock = (blockId: number, direction: 'up' | 'down') => {
    setBlocks(prevBlocks => {
      const currentIndex = prevBlocks.findIndex(block => block.id === blockId);
      
      if (currentIndex === -1) return prevBlocks;
      if (direction === 'up' && currentIndex === 0) return prevBlocks;
      if (direction === 'down' && currentIndex === prevBlocks.length - 1) return prevBlocks;
      
      const newBlocks = [...prevBlocks];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      [newBlocks[currentIndex], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[currentIndex]];
      
      return newBlocks;
    });
  };

  // Function to handle template completion
  const handleComplete = () => {
    // Combine all block content
    const finalContent = blocks.map(block => getBlockContent(block)).join('\n\n');
    
    // Call the onComplete callback
    if (data && data.onComplete) {
      data.onComplete(finalContent);
    }
    
    // Close the dialog
    dialogProps.onOpenChange(false);
    
    // Track usage
    trackEvent(EVENTS.TEMPLATE_USED, {
      template_id: data?.id,
      template_name: data?.title,
      template_type: data?.type,
      editor_mode: activeTab
    });
    
    // Dispatch events
    document.dispatchEvent(new CustomEvent('jaydai:placeholder-editor-closed'));
    document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
  };

  // Handle dialog close
  const handleClose = () => {
    dialogProps.onOpenChange(false);
    document.dispatchEvent(new CustomEvent('jaydai:placeholder-editor-closed'));
    document.dispatchEvent(new CustomEvent('jaydai:close-all-panels'));
  };

  if (!isOpen) return null;

  const commonProps = {
    blocks,
    onAddBlock: handleAddBlock,
    onRemoveBlock: handleRemoveBlock,
    onUpdateBlock: handleUpdateBlock,
    onMoveBlock: handleMoveBlock,
    isProcessing
  };

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          handleClose();
        }
        dialogProps.onOpenChange(open);
      }}
      title={getMessage('placeholderEditor', undefined, 'Prompt Block Editor')}
      description={getMessage('placeholderEditorDescription', undefined, 'Build your prompt using blocks')}
      className="jd-max-w-6xl jd-h-[90vh]"
    >
      <div className="jd-flex jd-flex-col jd-h-full jd-gap-4">
        {error && (
          <Alert variant="destructive" className="jd-mb-2">
            <AlertTriangle className="jd-h-4 jd-w-4 jd-mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isProcessing ? (
          <div className="jd-flex jd-items-center jd-justify-center jd-h-64">
            <div className="jd-animate-spin jd-h-8 jd-w-8 jd-border-4 jd-border-primary jd-border-t-transparent jd-rounded-full"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'basic' | 'advanced')} className="jd-flex-1 jd-flex jd-flex-col">
            <TabsList className="jd-grid jd-w-full jd-grid-cols-2 jd-mb-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="jd-flex-1 jd-overflow-hidden">
              <BasicEditor {...commonProps} />
            </TabsContent>
            
            <TabsContent value="advanced" className="jd-flex-1 jd-overflow-hidden">
              <AdvancedEditor {...commonProps} />
            </TabsContent>
          </Tabs>
        )}
        
        {/* Footer */}
        <div className="jd-flex jd-justify-end jd-gap-2 jd-pt-4 jd-border-t">
          <Button variant="outline" onClick={handleClose}>
            {getMessage('cancel', undefined, 'Cancel')}
          </Button>
          <Button onClick={handleComplete} disabled={blocks.length === 0}>
            {getMessage('useTemplate', undefined, 'Use Template')}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
};