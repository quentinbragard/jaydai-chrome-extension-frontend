// src/components/dialogs/blocks/CreateBlockDialog.tsx
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from 'lucide-react';
import { cn } from '@/core/utils/classNames';
import { toast } from 'sonner';
import { blocksApi } from '@/services/api/BlocksApi';
import { BaseDialog } from '@/components/dialogs/BaseDialog';
import { useDialog } from '@/components/dialogs/DialogContext';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { BlockType } from '@/types/prompts/blocks';
import { BLOCK_TYPE_LABELS, getBlockTypeIcon, getBlockTypeColors } from '@/utils/prompts/blockUtils';
import { useThemeDetector } from '@/hooks/useThemeDetector';

const AVAILABLE_BLOCK_TYPES: BlockType[] = [
  'role', 'context', 'goal', 'custom',
  'output_format', 'example', 'constraint', 'tone_style', 'audience'
];

export const CreateBlockDialog: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.CREATE_BLOCK);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [blockType, setBlockType] = useState<BlockType>('role');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const isDarkMode = useThemeDetector();
  const Icon = getBlockTypeIcon(blockType);
  const typeColors = getBlockTypeColors(blockType, isDarkMode);

  // Extract data from dialog context
  const initialType = data?.initialType as BlockType;
  const initialContent = data?.initialContent || '';
  const onBlockCreated = data?.onBlockCreated;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setBlockType(initialType || 'role');
      setName('');
      setDescription('');
      setValidationErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialType, initialContent]);


  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'Block name is required';
    }
    
    if (!content.trim()) {
      errors.content = 'Block content is required';
    }
    
    if (!blockType) {
      errors.type = 'Block type is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) {
      return;
    }
  
    setIsSubmitting(true);
    try {
      const blockData = {
        type: blockType,
        content: content.trim(),
        title: name.trim(),    
        description: description.trim() || undefined
      };
      
      const response = await blocksApi.createBlock(blockData);
  
      if (response.success && response.data) {
        toast.success(`Block "${name}" created successfully`);
        
        if (onBlockCreated) {
          onBlockCreated(response.data);
        }
        
        handleClose();
      } else {
        toast.error(response.message || 'Failed to create block');
      }
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error('An error occurred while creating the block');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setContent('');
    setBlockType('custom');
    setValidationErrors({});
    setIsSubmitting(false);
    dialogProps.onOpenChange(false);
  };

  if (!isOpen) return null;

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={handleClose}
      title="Create Block"
      description="Create a new reusable block for your prompts"
      className="jd-max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="jd-space-y-6">
        {/* Block Type Selection */}
        <div>
          <label className="jd-text-sm jd-font-medium jd-mb-2 jd-block">Block Type</label>
          <Select value={blockType} onValueChange={(value) => setBlockType(value as BlockType)}>
            <SelectTrigger className={cn("jd-w-full", validationErrors.type && "jd-border-red-500")}>
              <SelectValue>
                <div className="jd-flex jd-items-center jd-gap-2">
                  <Icon className="jd-h-4 jd-w-4" />
                  {BLOCK_TYPE_LABELS[blockType]}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="jd-z-[10010]">
              {AVAILABLE_BLOCK_TYPES.map((type) => {
                const TypeIcon = getBlockTypeIcon(type);
                return (
                  <SelectItem key={type} value={type}>
                    <div className="jd-flex jd-items-center jd-gap-2">
                      <TypeIcon className="jd-h-4 jd-w-4" />
                      {BLOCK_TYPE_LABELS[type]}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {validationErrors.type && (
            <p className="jd-text-xs jd-text-red-500 jd-mt-1">{validationErrors.type}</p>
          )}
        </div>

        {/* Block Name */}
        <div>
          <label className="jd-text-sm jd-font-medium jd-mb-2 jd-block">Block Name</label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (validationErrors.name) {
                setValidationErrors(prev => ({ ...prev, name: '' }));
              }
            }}
            placeholder="Enter block name"
            className={cn("jd-w-full", validationErrors.name && "jd-border-red-500")}
            autoFocus
          />
          {validationErrors.name ? (
            <p className="jd-text-xs jd-text-red-500 jd-mt-1">{validationErrors.name}</p>
          ) : (
            !name.trim() && (
              <p className="jd-text-xs jd-text-muted-foreground jd-mt-1">Please enter a block name</p>
            )
          )}
        </div>
        
        {/* Block Content */}
        <div>
          <label className="jd-text-sm jd-font-medium jd-mb-2 jd-block">Block Content</label>
          <Textarea 
            value={content} 
            onChange={(e) => {
              setContent(e.target.value);
              if (validationErrors.content) {
                setValidationErrors(prev => ({ ...prev, content: '' }));
              }
            }}
            placeholder="Enter block content..."
            className={cn("jd-w-full jd-min-h-[120px] jd-resize-none", validationErrors.content && "jd-border-red-500")}
            rows={6}
          />
          {validationErrors.content && (
            <p className="jd-text-xs jd-text-red-500 jd-mt-1">{validationErrors.content}</p>
          )}
          {content && (
            <div className="jd-flex jd-justify-between jd-text-xs jd-text-muted-foreground jd-mt-1">
              <span>{content.length} characters</span>
              <span>{content.split('\n').length} lines</span>
            </div>
          )}
        </div>

        {/* Block Description (Optional) */}
        <div>
          <label className="jd-text-sm jd-font-medium jd-mb-2 jd-block">
            Description <span className="jd-text-muted-foreground">(optional)</span>
          </label>
          <Textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter block description..."
            className="jd-w-full jd-resize-none"
            rows={3}
          />
        </div>
        
        {/* Action Buttons */}
        <div className="jd-flex jd-justify-end jd-space-x-3 jd-pt-4 jd-border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="jd-h-4 jd-w-4 jd-mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim() || !content.trim()}
            className={cn(
              'jd-transition-all jd-duration-300',
              typeColors
            )}
          >
            {isSubmitting ? (
              <>
                <div className="jd-h-4 jd-w-4 jd-border-2 jd-border-current jd-border-t-transparent jd-animate-spin jd-rounded-full jd-inline-block jd-mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="jd-h-4 jd-w-4 jd-mr-2" />
                Create Block
              </>
            )}
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
};