// src/components/dialogs/templates/editor/BlockDetailEditor.tsx
import React, { useState, useEffect } from 'react';
import { Block, BlockType } from '@/components/templates/blocks/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { blocksApi } from '@/services/api/BlocksApi';
import { getCurrentLanguage } from '@/core/utils/i18n';
import { toast } from 'sonner';
import { 
  FileText,
  User,
  MessageSquare,
  Layout,
  Users,
  Type,
  Save,
  RotateCcw,
  Copy,
  Database
} from 'lucide-react';

interface BlockDetailEditorProps {
  block: Block;
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
}

const BLOCK_ICONS = {
  content: FileText,
  context: MessageSquare,
  role: User,
  example: Layout,
  format: Type,
  audience: Users
};

const BLOCK_DESCRIPTIONS = {
  content: "The main content or body of your prompt",
  context: "Background information or context setting",
  role: "Define the AI's role or persona",
  example: "Provide examples to guide the AI's response",
  format: "Specify the desired output format",
  audience: "Define the target audience or user"
};

export const BlockDetailEditor: React.FC<BlockDetailEditorProps> = ({
  block,
  onUpdateBlock
}) => {
  const [localBlock, setLocalBlock] = useState<Block>(block);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when block prop changes (different block selected)
  useEffect(() => {
    setLocalBlock(block);
    setHasChanges(false);
  }, [block.id]);

  // Get block content as string
  const getContentAsString = (content: Block['content']): string => {
    if (typeof content === 'string') {
      return content;
    } else if (content && typeof content === 'object') {
      return Object.values(content)[0] || '';
    }
    return '';
  };

  // Handle local changes
  const handleChange = (field: keyof Block, value: any) => {
    setLocalBlock(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // If this is a real block (has a backend ID > 1000), save to backend
      if (block.id > 1000) {
        const locale = getCurrentLanguage();
        const updateResponse = await blocksApi.updateBlock(block.id, {
          type: localBlock.type,
          content: { [locale]: getContentAsString(localBlock.content) },
          title: { [locale]: localBlock.name || '' },
          description: { [locale]: localBlock.description || '' }
        });

        if (!updateResponse.success) {
          toast.error('Failed to save block to database: ' + updateResponse.message);
          return;
        }
        toast.success('Block saved to database');
      }

      // Update local state
      onUpdateBlock(block.id, localBlock);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving block:', error);
      toast.error('Failed to save block');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset changes
  const handleReset = () => {
    setLocalBlock(block);
    setHasChanges(false);
  };

  // Save to database as new block
  const handleSaveAsNew = async () => {
    setIsSaving(true);
    try {
      const locale = getCurrentLanguage();
      const createResponse = await blocksApi.createBlock({
        type: localBlock.type,
        content: { [locale]: getContentAsString(localBlock.content) },
        title: { [locale]: localBlock.name || `${localBlock.type} Block` },
        description: { [locale]: localBlock.description || '' }
      });

      if (createResponse.success) {
        toast.success('Block saved to library');
        // Update the local block with the new ID
        const newBlock = { ...localBlock, id: createResponse.data.id };
        setLocalBlock(newBlock);
        onUpdateBlock(block.id, newBlock);
        setHasChanges(false);
      } else {
        toast.error('Failed to save block: ' + createResponse.message);
      }
    } catch (error) {
      console.error('Error saving block:', error);
      toast.error('Failed to save block');
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate block
  const handleDuplicate = () => {
    const duplicatedBlock = {
      ...localBlock,
      id: Date.now() + Math.random(),
      name: `${localBlock.name || 'Block'} (Copy)`
    };
    
    onUpdateBlock(block.id, duplicatedBlock);
    toast.success('Block duplicated');
  };

  const IconComponent = BLOCK_ICONS[block.type] || FileText;
  const description = BLOCK_DESCRIPTIONS[block.type] || '';
  const isNewBlock = block.id < 1000; // Assume IDs < 1000 are temporary/new blocks

  return (
    <div className="jd-flex jd-flex-col jd-h-full">
      {/* Header */}
      <Card className="jd-mb-4">
        <CardHeader className="jd-pb-3">
          <CardTitle className="jd-flex jd-items-center jd-gap-2 jd-text-lg">
            <IconComponent className="jd-h-5 jd-w-5" />
            <span>{block.name || `${block.type} Block`}</span>
            <div className="jd-ml-auto jd-flex jd-items-center jd-gap-2">
              <Badge variant="secondary">
                {block.type}
              </Badge>
              {isNewBlock && (
                <Badge variant="outline" className="jd-text-xs">
                  New
                </Badge>
              )}
            </div>
          </CardTitle>
          {description && (
            <p className="jd-text-sm jd-text-muted-foreground">
              {description}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Editor Form */}
      <div className="jd-flex-1 jd-overflow-y-auto jd-space-y-4">
        {/* Block Type */}
        <div>
          <Label htmlFor="block-type">Block Type</Label>
          <Select 
            value={localBlock.type} 
            onValueChange={(value: BlockType) => handleChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BLOCK_ICONS).map(([type, Icon]) => (
                <SelectItem key={type} value={type}>
                  <div className="jd-flex jd-items-center jd-gap-2">
                    <Icon className="jd-h-4 jd-w-4" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Block Name */}
        <div>
          <Label htmlFor="block-name">Block Name</Label>
          <Input
            id="block-name"
            value={localBlock.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={`${block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block`}
            className="jd-mt-1"
          />
        </div>

        {/* Block Description */}
        <div>
          <Label htmlFor="block-description">Description (Optional)</Label>
          <Input
            id="block-description"
            value={localBlock.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Brief description of this block's purpose"
            className="jd-mt-1"
          />
        </div>

        {/* Block Content */}
        <div className="jd-flex-1">
          <Label htmlFor="block-content">Content</Label>
          <Textarea
            id="block-content"
            value={getContentAsString(localBlock.content)}
            onChange={(e) => handleChange('content', e.target.value)}
            placeholder={`Enter your ${block.type} content here...`}
            className="jd-mt-1 jd-min-h-[200px] jd-resize-none jd-flex-1"
            rows={10}
          />
          <p className="jd-text-xs jd-text-muted-foreground jd-mt-1">
            Use [placeholders] to create dynamic content that users can customize.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="jd-flex jd-flex-col jd-gap-2 jd-pt-4 jd-border-t jd-mt-4">
        {/* Primary Actions */}
        {hasChanges && (
          <div className="jd-flex jd-gap-2">
            <Button onClick={handleSave} size="sm" disabled={isSaving}>
              <Save className="jd-h-4 jd-w-4 jd-mr-1" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm">
              <RotateCcw className="jd-h-4 jd-w-4 jd-mr-1" />
              Reset
            </Button>
          </div>
        )}

        {/* Secondary Actions */}
        <div className="jd-flex jd-gap-2">
          {isNewBlock && getContentAsString(localBlock.content).trim() && (
            <Button 
              onClick={handleSaveAsNew} 
              variant="outline" 
              size="sm" 
              disabled={isSaving}
            >
              <Database className="jd-h-4 jd-w-4 jd-mr-1" />
              Save to Library
            </Button>
          )}
          <Button onClick={handleDuplicate} variant="outline" size="sm">
            <Copy className="jd-h-4 jd-w-4 jd-mr-1" />
            Duplicate
          </Button>
        </div>

        {/* Info */}
        <div className="jd-text-xs jd-text-muted-foreground jd-mt-2">
          {isNewBlock ? (
            <p>This is a temporary block. Save to library to reuse in other templates.</p>
          ) : (
            <p>This block is saved in your library and can be reused.</p>
          )}
        </div>
      </div>
    </div>
  );
};