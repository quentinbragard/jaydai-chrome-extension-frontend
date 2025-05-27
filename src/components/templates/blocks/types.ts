// src/components/dialogs/templates/blocks/types.ts

export type BlockType =
  | 'context'
  | 'role'
  | 'example'
  | 'format'
  | 'audience'
  | 'content'
  | 'tone_style'
  | 'output_format'
  | 'output_language'
  | 'main_context'
  | 'main_goal'
  | 'constraints'
  | 'thinking_steps'
  | 'additional_context'
  | 'custom';

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
    id: "tone_style",
    name: "Tone/Style",
    description: "Specifies the tone or style",
    color: "jd-bg-yellow-500"
  },
  {
    id: "output_format",
    name: "Output Format",
    description: "Desired output format",
    color: "jd-bg-indigo-500"
  },
  {
    id: "output_language",
    name: "Output Language",
    description: "Language of the output",
    color: "jd-bg-red-500"
  },
  {
    id: "main_context",
    name: "Main Context",
    description: "Main context information",
    color: "jd-bg-teal-500"
  },
  {
    id: "main_goal",
    name: "Main Goal",
    description: "Primary goal of the prompt",
    color: "jd-bg-cyan-500"
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