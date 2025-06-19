import { PromptMetadata, SingleMetadataType } from '@/types/prompts/metadata';
import { getBlockTypeLabel, getBlockTextColors } from '@/utils/prompts/blockUtils';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getBlockTypeLabelHtml(type: string, isDarkMode: boolean): string {
  const prefix = getBlockTypeLabel(type);
  if (!prefix) return '';
  const colorClass = getBlockTextColors(type as any, isDarkMode);
  return `<span class="${colorClass} jd-font-semibold">${escapeHtml(prefix)}</span>`;
}

export function buildMetadataOnlyPreview(metadata: PromptMetadata): string {
  const parts: string[] = [];
  ['role','context','goal','audience','output_format','tone_style'].forEach(t => {
    const value = metadata.values?.[t as keyof typeof metadata.values];
    if (value?.trim()) {
      const prefix = getBlockTypeLabel(t);
      parts.push(prefix ? `${prefix} ${value}` : value);
    }
  });
  if (metadata.constraints) {
    metadata.constraints.forEach(item => {
      if (item.value.trim()) parts.push(`Contrainte: ${item.value}`);
    });
  }
  if (metadata.examples) {
    metadata.examples.forEach(item => {
      if (item.value.trim()) parts.push(`Exemple: ${item.value}`);
    });
  }
  return parts.filter(Boolean).join('\n\n');
}

export function buildMetadataOnlyPreviewHtml(metadata: PromptMetadata, isDark: boolean): string {
  const parts: string[] = [];
  ['role','context','goal','audience','output_format','tone_style'].forEach(t => {
    const value = metadata.values?.[t as keyof typeof metadata.values];
    if (value?.trim()) {
      const prefixHtml = getBlockTypeLabelHtml(t, isDark);
      parts.push(prefixHtml ? `${prefixHtml} ${escapeHtml(value)}` : escapeHtml(value));
    }
  });
  if (metadata.constraints) {
    metadata.constraints.forEach(item => {
      if (item.value.trim()) {
        const prefixHtml = getBlockTypeLabelHtml('constraint', isDark);
        parts.push(`${prefixHtml} ${escapeHtml(item.value)}`);
      }
    });
  }
  if (metadata.examples) {
    metadata.examples.forEach(item => {
      if (item.value.trim()) {
        const prefixHtml = getBlockTypeLabelHtml('example', isDark);
        parts.push(`${prefixHtml} ${escapeHtml(item.value)}`);
      }
    });
  }
  return parts.join('<br><br>');
}

export function buildCompletePreview(metadata: PromptMetadata, content: string): string {
  const meta = buildMetadataOnlyPreview(metadata);
  const parts = [meta, content.trim()].filter(Boolean);
  return parts.join('\n\n');
}

export function buildCompletePreviewHtml(metadata: PromptMetadata, content: string, isDark: boolean): string {
  const metaHtml = buildMetadataOnlyPreviewHtml(metadata, isDark);
  const parts = [metaHtml, content.trim() ? escapeHtml(content) : ''].filter(Boolean);
  const html = parts.join('<br><br>');
  return html.replace(/\[([^\]]+)\]/g,
    '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
  );
}

export function extractContentFromCompleteTemplate(complete: string, metadataPart: string): string {
  if (!metadataPart) return complete;
  if (complete.startsWith(metadataPart)) {
    const content = complete.substring(metadataPart.length).trim();
    return content.replace(/^\n+/, '');
  }
  const lines = complete.split('\n\n');
  const keywords = [
    'Ton rôle est de','Le contexte est','Ton objectif est',
    "L'audience ciblée est",'Le format attendu est','Le ton et style sont',
    'Contrainte:','Exemple:'
  ];
  let start = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (keywords.some(k => line.startsWith(k))) { start = i + 1; break; }
  }
  if (start < lines.length) return lines.slice(start).join('\n\n').trim();
  const last = lines[lines.length - 1];
  const looksLike = keywords.some(k => last.startsWith(k));
  return looksLike ? '' : last;
}

/** Resolve metadata values using block content cache */
export function resolveMetadataValues(
  metadata: PromptMetadata,
  blockMap: Record<number, string>
): PromptMetadata {
  const resolved: PromptMetadata = {
    ...metadata,
    values: { ...(metadata.values || {}) }
  };

  const singleTypes: SingleMetadataType[] = [
    'role',
    'context',
    'goal',
    'audience',
    'output_format',
    'tone_style'
  ];

  singleTypes.forEach(t => {
    const id = (metadata as any)[t];
    if (id && id !== 0) {
      resolved.values![t] = blockMap[id] || '';
    }
  });

  const resolveItems = (items?: { blockId?: number; value: string }[]) =>
    items?.map(item => ({
      ...item,
      value: item.blockId && blockMap[item.blockId]
        ? blockMap[item.blockId]
        : item.value
    }));

  resolved.constraints = resolveItems(metadata.constraints) as any;
  resolved.examples = resolveItems(metadata.examples) as any;

  return resolved;
}

/** Build preview text using block content */
export function buildCompletePreviewWithBlocks(
  metadata: PromptMetadata,
  content: string,
  blockMap: Record<number, string>
): string {
  const resolved = resolveMetadataValues(metadata, blockMap);
  return buildCompletePreview(resolved, content);
}

/** Build preview HTML using block content */
export function buildCompletePreviewHtmlWithBlocks(
  metadata: PromptMetadata,
  content: string,
  blockMap: Record<number, string>,
  isDark: boolean
): string {
  const resolved = resolveMetadataValues(metadata, blockMap);
  return buildCompletePreviewHtml(resolved, content, isDark);
}

// ============================================================================
// NEW: Build preview text and capture character ranges for each block
// ============================================================================

import type { BlockRangeMap } from '@/types/prompts/metadata';

export function buildCompletePreviewWithBlocksAndRanges(
  metadata: PromptMetadata,
  content: string,
  blockMap: Record<number, string>
): { text: string; ranges: BlockRangeMap } {
  const ranges: BlockRangeMap = {};
  let text = '';

  const append = (part: string): [number, number] => {
    if (text) {
      text += '\n\n';
    }
    const start = text.length;
    text += part;
    const end = text.length;
    return [start, end];
  };

  const singleTypes: SingleMetadataType[] = [
    'role',
    'context',
    'goal',
    'audience',
    'output_format',
    'tone_style'
  ];

  singleTypes.forEach(type => {
    const blockId = metadata[type];
    const value = blockId && blockMap[blockId] !== undefined
      ? blockMap[blockId]
      : metadata.values?.[type] || '';
    if (value && value.trim()) {
      const prefix = getBlockTypeLabel(type);
      const part = prefix ? `${prefix} ${value}` : value;
      const [start, end] = append(part);
      (ranges as any)[type] = { [blockId || 0]: [start, end] };
    }
  });

  if (metadata.constraints) {
    metadata.constraints.forEach(item => {
      const value = item.blockId && blockMap[item.blockId] !== undefined
        ? blockMap[item.blockId]
        : item.value;
      if (value.trim()) {
        const part = `Contrainte: ${value}`;
        const [start, end] = append(part);
        if (!ranges.constraint) ranges.constraint = [];
        ranges.constraint.push({ [item.blockId || 0]: [start, end] });
      }
    });
  }

  if (metadata.examples) {
    metadata.examples.forEach(item => {
      const value = item.blockId && blockMap[item.blockId] !== undefined
        ? blockMap[item.blockId]
        : item.value;
      if (value.trim()) {
        const part = `Exemple: ${value}`;
        const [start, end] = append(part);
        if (!ranges.example) ranges.example = [];
        ranges.example.push({ [item.blockId || 0]: [start, end] });
      }
    });
  }

  if (content && content.trim()) {
    const [start, end] = append(content.trim());
    ranges.content = { 0: [start, end] };
  }

  return { text, ranges };
}

