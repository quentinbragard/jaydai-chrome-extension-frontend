// src/components/dialogs/templates/blocks/BlockItem.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Edit, 
  Check, 
  X, 
  ArrowUp, 
  ArrowDown,
  GripVertical
} from 'lucide-react';
import { BlockItemProps, BLOCK_TYPES } from './types';
import { getMessage, getCurrentLanguage } from '@/core/utils/i18n';
import { cn } from "@/core/utils/classNames";

/**
 * Individual block item component with inline editing
 */
export const BlockItem: React.FC<BlockItemProps> = ({
  block,
  index,
  isActive,
  onEdit,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) => {
  const [editableName, setEditableName] = useState(block.name || '');
  const [editableContent, setEditableContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get block type info
  const blockTypeInfo = BLOCK_TYPES.find(bt => bt.id === block.type);

  // Helper function to get content from block
  const getBlockContent = (): string => {
    if (typeof block.content === 'string') {
      return block.content;
    } else if (block.content && typeof block.content === 'object') {
      const locale = getCurrentLanguage();
      return block.content[locale] || block.content.en || Object.values(block.content)[0] || '';
    }
    return '';
  };

  // Initialize editable content when block becomes active
  useEffect(() => {
    if (isActive) {
      const content = getBlockContent();
      setEditableContent(content);
      setEditableName(block.name || '');
    }
  }, [isActive, block]);

  // Auto-focus textarea when becoming active
  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isActive]);

  // Handle saving changes
  const handleSave = () => {
    onUpdate({
      name: editableName.trim() || blockTypeInfo?.name || 'Block',
      content: editableContent
    });
    onEdit(); // Close edit mode
  };

  // Handle canceling edit
  const handleCancel = () => {
    setEditableName(block.name || '');
    setEditableContent(getBlockContent());
    onEdit(); // Close edit mode
  };

  // Handle key shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  // Function to highlight placeholders in text
  const highlightPlaceholders = (text: string) => {
    return text.replace(
      /\[(.*?)\]/g, 
      `<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>`
    );
  };

  return (
    <Card className={cn(
      "jd-transition-all jd-duration-200",
      isActive ? "jd-ring-2 jd-ring-primary jd-shadow-md" : "hover:jd-shadow-sm"
    )}>
      <CardHeader className="jd-py-3 jd-px-4">
        <div className="jd-flex jd-items-center jd-gap-2">
          {/* Drag handle */}
          <GripVertical className="jd-h-4 jd-w-4 jd-text-muted-foreground jd-cursor-grab" />
          
          {/* Block type indicator */}
          <div className={`jd-w-3 jd-h-3 jd-rounded-full ${blockTypeInfo?.color || 'jd-bg-gray-500'}`} />
          
          {/* Block name */}
          <div className="jd-flex-1">
            {isActive ? (
              <Input
                value={editableName}
                onChange={(e) => setEditableName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="jd-h-7 jd-text-sm jd-font-medium"
                placeholder={blockTypeInfo?.name || 'Block Name'}
              />
            ) : (
              <h4 className="jd-text-sm jd-font-medium jd-truncate">
                {block.name || blockTypeInfo?.name || 'Block'}
              </h4>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="jd-flex jd-items-center jd-gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="jd-h-7 jd-w-7"
              title={getMessage('moveUp', undefined, 'Move Up')}
            >
              <ArrowUp className="jd-h-3.5 jd-w-3.5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="jd-h-7 jd-w-7"
              title={getMessage('moveDown', undefined, 'Move Down')}
            >
              <ArrowDown className="jd-h-3.5 jd-w-3.5" />
            </Button>
            
            {isActive ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  className="jd-h-7 jd-w-7 jd-text-green-600 hover:jd-text-green-700"
                  title={getMessage('save', undefined, 'Save')}
                >
                  <Check className="jd-h-3.5 jd-w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  className="jd-h-7 jd-w-7 jd-text-red-600 hover:jd-text-red-700"
                  title={getMessage('cancel', undefined, 'Cancel')}
                >
                  <X className="jd-h-3.5 jd-w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEdit}
                  className="jd-h-7 jd-w-7"
                  title={getMessage('edit', undefined, 'Edit')}
                >
                  <Edit className="jd-h-3.5 jd-w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRemove}
                  className="jd-h-7 jd-w-7 jd-text-red-600 hover:jd-text-red-700"
                  title={getMessage('remove', undefined, 'Remove')}
                >
                  <X className="jd-h-3.5 jd-w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="jd-pt-0 jd-px-4 jd-pb-4">
        {isActive ? (
          <Textarea
            ref={textareaRef}
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="jd-min-h-[120px] jd-font-mono jd-text-sm jd-resize-none"
            placeholder={`Enter ${blockTypeInfo?.name || 'block'} content...`}
          />
        ) : (
          <div 
            className="jd-whitespace-pre-wrap jd-p-3 jd-bg-muted/30 jd-rounded-md jd-text-sm jd-font-mono jd-max-h-[150px] jd-overflow-y-auto jd-cursor-pointer"
            onClick={onEdit}
            dangerouslySetInnerHTML={{ __html: highlightPlaceholders(getBlockContent()) }}
          />
        )}
        
        {isActive && (
          <div className="jd-mt-2 jd-text-xs jd-text-muted-foreground">
            {getMessage('editingTip', undefined, 'Tip: Use [placeholder] syntax for dynamic content. Press Ctrl+Enter to save, Escape to cancel.')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};