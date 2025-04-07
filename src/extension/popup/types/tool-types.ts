// src/extension/popup/types/tool-types.ts
import { ReactNode } from 'react';

export interface AITool {
  name: string;
  icon: ReactNode;
  url: string;
  description: string;
  disabled: boolean;
  color: string;
}