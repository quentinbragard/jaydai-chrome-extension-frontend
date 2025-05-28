import { Block, BlockType } from '@/types/prompts/blocks';
import { MetadataType } from '@/types/prompts/metadata';
import { getBlockContent } from '@/components/prompts/blocks/blockUtils';

// French prefixes for metadata and blocks
const PREFIXES: Partial<Record<BlockType | MetadataType, string>> = {
  role: 'Ton rôle est de',
  context: 'Le contexte est',
  goal: "Ton objectif est",
  audience: "L'audience ciblée est",
  format: 'Le format attendu est',
  example: 'Exemple:',
};

const PRIMARY_METADATA: MetadataType[] = ['role', 'context', 'goal'];
const SECONDARY_METADATA: MetadataType[] = ['audience', 'format', 'example'];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getHighlightClass(type: BlockType | MetadataType | null): string {
  if (type && PRIMARY_METADATA.includes(type as MetadataType)) {
    return 'jd-text-purple-600 jd-font-semibold';
  }
  if (type && SECONDARY_METADATA.includes(type as MetadataType)) {
    return 'jd-text-teal-600 jd-font-semibold';
  }
  return 'jd-text-orange-600 jd-font-semibold';
}

export function formatMetadataForPrompt(type: MetadataType, value: string): string {
  const prefix = PREFIXES[type];
  const content = value.trim();
  return prefix ? `${prefix} ${content}` : content;
}

export function formatMetadataForPreview(type: MetadataType, value: string): string {
  const prefix = PREFIXES[type];
  const cls = getHighlightClass(type);
  const content = escapeHtml(value.trim());
  if (!prefix) return content;
  return `<span class="${cls}">${escapeHtml(prefix)}</span> ${content}`;
}

export function formatBlockForPrompt(block: Block): string {
  const content = getBlockContent(block).trim();
  if (!content) return '';
  const prefix = block.type ? PREFIXES[block.type] : undefined;
  return prefix ? `${prefix} ${content}` : content;
}

export function formatBlockForPreview(block: Block): string {
  const content = escapeHtml(getBlockContent(block).trim());
  if (!content) return '';
  const prefix = block.type ? PREFIXES[block.type] : undefined;
  const cls = getHighlightClass(block.type || 'custom');
  if (!prefix) return content;
  return `<span class="${cls}">${escapeHtml(prefix)}</span> ${content}`;
}
