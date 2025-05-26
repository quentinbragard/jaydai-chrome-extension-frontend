// src/components/dialogs/templates/blocks/types.ts

export type BlockType = 'context' | 'role' | 'example' | 'format' | 'audience' | 'content';

export interface Block {
  id: number;
  type: BlockType;
  content: string | Record<string, string>;
  name?: string;
  description?: string;
  created_at?: string;
  user_id?: string;
  organization_id?: string;
  company_id?: string;
}

export interface BlockTypeDefinition {
  id: BlockType;
  name: string;
  description: string;
  color: string;
}

export const BLOCK_TYPES: BlockTypeDefinition[] = [
  { 
    id: "context", 
    name: "Context", 
    description: "Provides background information and context",
    color: "jd-bg-blue-500"
  },
  { 
    id: "role", 
    name: "Role", 
    description: "Defines the role or persona the AI should adopt",
    color: "jd-bg-green-500"
  },
  { 
    id: "example", 
    name: "Example", 
    description: "Provides examples of expected output",
    color: "jd-bg-purple-500"
  },
  { 
    id: "format", 
    name: "Format", 
    description: "Specifies output format requirements",
    color: "jd-bg-orange-500"
  },
  { 
    id: "audience", 
    name: "Audience", 
    description: "Describes the target audience",
    color: "jd-bg-pink-500"
  },
  { 
    id: "content", 
    name: "Content", 
    description: "Main content of the prompt",
    color: "jd-bg-gray-500"
  }
];

export interface AddBlockButtonProps {
  position: 'start' | 'end';
  onAddBlock: (position: 'start' | 'end', blockType: BlockType, existingBlock?: Block) => void;
  className?: string;
}

export interface BlockEditorProps {
  blocks: Block[];
  onUpdateBlock: (blockId: number, updatedBlock: Partial<Block>) => void;
  onRemoveBlock: (blockId: number) => void;
  onMoveBlock: (blockId: number, direction: 'up' | 'down') => void;
}

export interface BlockItemProps {
  block: Block;
  index: number;
  isActive: boolean;
  onEdit: () => void;
  onUpdate: (updatedBlock: Partial<Block>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export interface BlockSelectorProps {
  onSelectBlock: (blockType: BlockType, existingBlock?: Block) => void;
  onCancel: () => void;
}

export interface ExistingBlocksDropdownProps {
  blockType: BlockType;
  onSelectExisting: (block: Block) => void;
  onCreateNew: () => void;
}