// src/components/dialogs/templates/editor/BlockDetailEditor.tsx
import React, { useState, useEffect } from 'react';
import { Block } from '@/components/templates/blocks/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText,
  User,
  MessageSquare,
  Layout,
  Users,
  Type,
  Save,
  RotateCcw
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
  const handleSave = () => {
    onUpdateBlock(block.id, localBlock);
    setHasChanges(false);
  };

  // Reset changes
  const handleReset = () => {
    setLocalBlock(block);
    setHasChanges(false);
  };

  const IconComponent = BLOCK_ICONS[block.type] || FileText;
  const description = BLOCK_DESCRIPTIONS[block.type] || '';

  return (
    <div className="jd-flex jd-flex-col jd-h-full">
      {/* Header */}
      <Card className="jd-mb-4">
        <CardHeader className="jd-pb-3">
          <CardTitle className="jd-flex jd-items-center jd-gap-2 jd-text-lg">
            <IconComponent className="jd-h-5 jd-w-5" />
            <span>{block.name || `${block.type} Block`}</span>
            <Badge variant="secondary" className="jd-ml-auto">
              {block.type}
            </Badge>
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
      {hasChanges && (
        <div className="jd-flex jd-gap-2 jd-pt-4 jd-border-t jd-mt-4">
          <Button onClick={handleSave} size="sm">
            <Save className="jd-h-4 jd-w-4 jd-mr-1" />
            Save Changes
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm">
            <RotateCcw className="jd-h-4 jd-w-4 jd-mr-1" />
            Reset
          </Button>
        </div>
      )}
    </div>
  );
};