// src/components/prompts/blocks/blockUtils.ts
import React from 'react';
import {
  FileText,
  MessageSquare,
  Target,
  Users,
  Layout,
  Type,
  Ban,
  Palette,
  User,
  BrainCog,
  Sparkles
} from 'lucide-react';
import { BlockType, Block } from '@/types/prompts/blocks';
import { getCurrentLanguage } from '@/core/utils/i18n';

export const BLOCK_TYPES: BlockType[] = [
  'role',
  'context',
  'goal',
  'content',
  'custom',
  'output_format',
  'example',
  'constraint',
  'tone_style',
  'audience',
  'thinking_step'
];

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  role: 'Role',
  context: 'Context',
  goal: 'Goal',
  content: 'Content',
  custom: 'Custom',
  output_format: 'Output Format',
  example: 'Example',
  constraint: 'Constraint',
  tone_style: 'Tone & Style',
  audience: 'Audience',
  thinking_step: 'Thinking Step'
};

export const BLOCK_TYPE_ICONS: Record<BlockType, React.ComponentType<any>> = {
  role: User,
  context: MessageSquare,
  goal: Target,
  content: FileText,
  custom: Sparkles,
  output_format: Type,
  example: Layout,
  constraint: Ban,
  tone_style: Palette,
  audience: Users,
  thinking_step: BrainCog
};

export const BLOCK_TYPE_DESCRIPTIONS: Record<BlockType, string> = {
  role: "Define the AI's role",
  context: 'Provide context information',
  goal: 'Specify the goal',
  content: 'Main content for the prompt',
  custom: 'Custom user content',
  output_format: 'Desired output format',
  example: 'Provide an example',
  constraint: 'Specify constraints',
  tone_style: 'Define tone and style',
  audience: 'Describe the target audience',
  thinking_step: 'Guide the reasoning process'
};

// Gradient card colors
export const BLOCK_CARD_COLORS_LIGHT: Record<BlockType, string> = {
  role: 'jd-bg-gradient-to-br jd-from-purple-50 jd-to-purple-100 jd-border-purple-200 jd-text-purple-900',
  context: 'jd-bg-gradient-to-br jd-from-green-50 jd-to-green-100 jd-border-green-200 jd-text-green-900',
  goal: 'jd-bg-gradient-to-br jd-from-blue-50 jd-to-blue-100 jd-border-blue-200 jd-text-blue-900',
  content: 'jd-bg-gradient-to-br jd-from-slate-50 jd-to-slate-100 jd-border-slate-200 jd-text-slate-900',
  custom: 'jd-bg-gradient-to-br jd-from-amber-50 jd-to-amber-100 jd-border-amber-200 jd-text-amber-900',
  output_format: 'jd-bg-gradient-to-br jd-from-pink-50 jd-to-pink-100 jd-border-pink-200 jd-text-pink-900',
  example: 'jd-bg-gradient-to-br jd-from-orange-50 jd-to-orange-100 jd-border-orange-200 jd-text-orange-900',
  constraint: 'jd-bg-gradient-to-br jd-from-red-50 jd-to-red-100 jd-border-red-200 jd-text-red-900',
  tone_style: 'jd-bg-gradient-to-br jd-from-indigo-50 jd-to-indigo-100 jd-border-indigo-200 jd-text-indigo-900',
  audience: 'jd-bg-gradient-to-br jd-from-teal-50 jd-to-teal-100 jd-border-teal-200 jd-text-teal-900',
  thinking_step: 'jd-bg-gradient-to-br jd-from-yellow-50 jd-to-yellow-100 jd-border-yellow-200 jd-text-yellow-900'
};

export const BLOCK_CARD_COLORS_DARK: Record<BlockType, string> = {
  role: 'jd-bg-gradient-to-br jd-from-purple-800/40 jd-to-purple-900/40 jd-border-purple-700 jd-text-purple-200',
  context: 'jd-bg-gradient-to-br jd-from-green-800/40 jd-to-green-900/40 jd-border-green-700 jd-text-green-200',
  goal: 'jd-bg-gradient-to-br jd-from-blue-800/40 jd-to-blue-900/40 jd-border-blue-700 jd-text-blue-200',
  content: 'jd-bg-gradient-to-br jd-from-slate-700/40 jd-to-slate-800/40 jd-border-slate-600 jd-text-slate-200',
  custom: 'jd-bg-gradient-to-br jd-from-amber-800/40 jd-to-amber-900/40 jd-border-amber-700 jd-text-amber-200',
  output_format: 'jd-bg-gradient-to-br jd-from-pink-800/40 jd-to-pink-900/40 jd-border-pink-700 jd-text-pink-200',
  example: 'jd-bg-gradient-to-br jd-from-orange-800/40 jd-to-orange-900/40 jd-border-orange-700 jd-text-orange-200',
  constraint: 'jd-bg-gradient-to-br jd-from-red-800/40 jd-to-red-900/40 jd-border-red-700 jd-text-red-200',
  tone_style: 'jd-bg-gradient-to-br jd-from-indigo-800/40 jd-to-indigo-900/40 jd-border-indigo-700 jd-text-indigo-200',
  audience: 'jd-bg-gradient-to-br jd-from-teal-800/40 jd-to-teal-900/40 jd-border-teal-700 jd-text-teal-200',
  thinking_step: 'jd-bg-gradient-to-br jd-from-yellow-800/40 jd-to-yellow-900/40 jd-border-yellow-700 jd-text-yellow-200'
};

// Icon background colors
export const BLOCK_ICON_COLORS_LIGHT: Record<BlockType, string> = {
  role: 'jd-bg-purple-100 jd-text-purple-700',
  context: 'jd-bg-green-100 jd-text-green-700',
  goal: 'jd-bg-blue-100 jd-text-blue-700',
  content: 'jd-bg-slate-100 jd-text-slate-700',
  custom: 'jd-bg-amber-100 jd-text-amber-700',
  output_format: 'jd-bg-pink-100 jd-text-pink-700',
  example: 'jd-bg-orange-100 jd-text-orange-700',
  constraint: 'jd-bg-red-100 jd-text-red-700',
  tone_style: 'jd-bg-indigo-100 jd-text-indigo-700',
  audience: 'jd-bg-teal-100 jd-text-teal-700',
  thinking_step: 'jd-bg-yellow-100 jd-text-yellow-700'
};

export const BLOCK_ICON_COLORS_DARK: Record<BlockType, string> = {
  role: 'jd-bg-purple-800 jd-text-purple-300',
  context: 'jd-bg-green-800 jd-text-green-300',
  goal: 'jd-bg-blue-800 jd-text-blue-300',
  content: 'jd-bg-slate-700 jd-text-slate-200',
  custom: 'jd-bg-amber-800 jd-text-amber-300',
  output_format: 'jd-bg-pink-800 jd-text-pink-300',
  example: 'jd-bg-orange-800 jd-text-orange-300',
  constraint: 'jd-bg-red-800 jd-text-red-300',
  tone_style: 'jd-bg-indigo-800 jd-text-indigo-300',
  audience: 'jd-bg-teal-800 jd-text-teal-300',
  thinking_step: 'jd-bg-yellow-800 jd-text-yellow-300'
};

export const getBlockTypeLabel = (type: BlockType): string => BLOCK_TYPE_LABELS[type] || type;
export const getBlockTypeIcon = (type: BlockType) => BLOCK_TYPE_ICONS[type] || FileText;
export const getBlockTypeDescription = (type: BlockType): string => BLOCK_TYPE_DESCRIPTIONS[type] || '';
export const getBlockTypeColors = (type: BlockType, dark: boolean): string => (dark ? BLOCK_CARD_COLORS_DARK[type] : BLOCK_CARD_COLORS_LIGHT[type]);
export const getBlockIconColors = (type: BlockType, dark: boolean): string => (dark ? BLOCK_ICON_COLORS_DARK[type] : BLOCK_ICON_COLORS_LIGHT[type]);

export const getBlockContent = (block: Block): string => {
  if (typeof block.content === 'string') return block.content;
  if (block.content && typeof block.content === 'object') {
    const locale = getCurrentLanguage();
    return block.content[locale] || block.content.en || Object.values(block.content)[0] || '';
  }
  return '';
};

export const getLocalizedContent = (content: any): string => {
  if (typeof content === 'string') return content;
  if (content && typeof content === 'object') {
    const locale = getCurrentLanguage();
    return content[locale] || content.en || Object.values(content)[0] || '';
  }
  return '';
};

const PROMPT_PREFIXES_FR: Record<BlockType, string> = {
  role: "Ton rôle est d'être ",
  context: 'Contexte : ',
  goal: 'Ton objectif est ',
  content: '',
  custom: '',
  output_format: 'Format de sortie : ',
  example: 'Exemple : ',
  constraint: 'Contrainte : ',
  tone_style: 'Ton et style : ',
  audience: 'Audience cible : ',
  thinking_step: 'Étape de réflexion : '
};

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');

export const buildPromptPart = (type: BlockType | null | undefined, content: string): string => {
  if (!type || type === 'custom' || type === 'content') {
    return content;
  }
  const prefix = PROMPT_PREFIXES_FR[type];
  return prefix ? `${prefix}${content}` : content;
};

export const buildPromptPartHtml = (type: BlockType | null | undefined, content: string): string => {
  if (!type || type === 'custom' || type === 'content') {
    return escapeHtml(content);
  }
  const prefix = PROMPT_PREFIXES_FR[type];
  if (!prefix) {
    return escapeHtml(content);
  }
  return `<span class="jd-text-primary">${escapeHtml(prefix)}</span>${escapeHtml(content)}`;
};

