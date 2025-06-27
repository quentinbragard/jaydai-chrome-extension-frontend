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
  return `<span class="${colorClass} jd-font-black">${escapeHtml(prefix)}</span>`;
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
  if (metadata.constraint) {
    metadata.constraint.forEach(item => {
      if (item.value.trim()) parts.push(`Contrainte: ${item.value}`);
    });
  }
  if (metadata.example) {
    metadata.example.forEach(item => {
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
  if (metadata.constraint) {
    metadata.constraint.forEach(item => {
      if (item.value.trim()) {
        const prefixHtml = getBlockTypeLabelHtml('constraint', isDark);
        parts.push(`${prefixHtml} ${escapeHtml(item.value)}`);
      }
    });
  }
  if (metadata.example) {
    metadata.example.forEach(item => {
      if (item.value.trim()) {
        const prefixHtml = getBlockTypeLabelHtml('example', isDark);
        parts.push(`${prefixHtml} ${escapeHtml(item.value)}`);
      }
    });
  }
  return parts.join('<br><br>');
}

export function buildCompletePreview(metadata: PromptMetadata, content: string): string {
  const parts: string[] = [];

  // 1. Primary metadata (Role, Context, Goal)
  ['role', 'context', 'goal'].forEach(t => {
    const value = metadata.values?.[t as keyof typeof metadata.values];
    if (value?.trim()) {
      const prefix = getBlockTypeLabel(t);
      parts.push(prefix ? `${prefix} ${value}` : value);
    }
  });

  // 2. Main content
  if (content.trim()) {
    parts.push(content.trim());
  }

  // 3. Additional metadata (Audience, Output Format, Tone & Style)
  ['audience', 'output_format', 'tone_style'].forEach(t => {
    const value = metadata.values?.[t as keyof typeof metadata.values];
    if (value?.trim()) {
      const prefix = getBlockTypeLabel(t);
      parts.push(prefix ? `${prefix} ${value}` : value);
    }
  });

  if (metadata.constraint) {
    metadata.constraint.forEach(item => {
      if (item.value.trim()) parts.push(`Contrainte: ${item.value}`);
    });
  }

  if (metadata.example) {
    metadata.example.forEach(item => {
      if (item.value.trim()) parts.push(`Exemple: ${item.value}`);
    });
  }

  return parts.filter(Boolean).join('\n\n');
}

export function buildCompletePreviewHtml(metadata: PromptMetadata, content: string, isDark: boolean): string {
  const parts: string[] = [];

  // 1. Primary metadata
  ['role', 'context', 'goal'].forEach(t => {
    const value = metadata.values?.[t as keyof typeof metadata.values];
    if (value?.trim()) {
      const prefixHtml = getBlockTypeLabelHtml(t, isDark);
      parts.push(prefixHtml ? `${prefixHtml} ${escapeHtml(value)}` : escapeHtml(value));
    }
  });

  // 2. Main content
  if (content.trim()) {
    parts.push(escapeHtml(content.trim()));
  }

  // 3. Additional metadata
  ['audience', 'output_format', 'tone_style'].forEach(t => {
    const value = metadata.values?.[t as keyof typeof metadata.values];
    if (value?.trim()) {
      const prefixHtml = getBlockTypeLabelHtml(t, isDark);
      parts.push(prefixHtml ? `${prefixHtml} ${escapeHtml(value)}` : escapeHtml(value));
    }
  });

  if (metadata.constraint) {
    metadata.constraint.forEach(item => {
      if (item.value.trim()) {
        const prefixHtml = getBlockTypeLabelHtml('constraint', isDark);
        parts.push(`${prefixHtml} ${escapeHtml(item.value)}`);
      }
    });
  }

  if (metadata.example) {
    metadata.example.forEach(item => {
      if (item.value.trim()) {
        const prefixHtml = getBlockTypeLabelHtml('example', isDark);
        parts.push(`${prefixHtml} ${escapeHtml(item.value)}`);
      }
    });
  }

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

  resolved.constraint = resolveItems(metadata.constraint) as any;
  resolved.example = resolveItems(metadata.example) as any;

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

/**
 * Replace numeric block ID placeholders like `[123]` in the provided content
 * with their corresponding block text from the cache.
 */
export function replaceBlockIdsInContent(
  content: string,
  blockMap: Record<number, string>
): string {
  if (!content) return '';

  return content.replace(/\[(\d+)\]/g, (match, id) => {
    const text = blockMap[parseInt(id, 10)];
    return text !== undefined ? text : match;
  });
}

