// src/components/prompts/quick-selector/index.ts
export { QuickBlockSelector } from './QuickBlockSelector';
export { BlockItem } from './BlockItem';
export type { QuickBlockSelectorProps, BlockItemProps } from './types';

// Type definitions file: src/components/prompts/quick-selector/types.ts
export interface QuickBlockSelectorProps {
  position: { x: number; y: number };
  onClose: () => void;
  targetElement: HTMLElement;
  onOpenFullDialog: () => void;
}

export interface BlockItemProps {
  block: Block;
  isDark: boolean;
  onSelect: (block: Block) => void;
  isActive: boolean;
}