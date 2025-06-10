// src/components/prompts/promptUtils.ts - Enhanced version
import { Block, BlockType } from '@/types/prompts/blocks';
import { 
  MetadataType, 
  SingleMetadataType, 
  MultipleMetadataType, 
  PromptMetadata,
  MetadataItem,
  isMultipleMetadataType 
} from '@/types/prompts/metadata';
import { getBlockContent } from '@/components/prompts/blocks/blockUtils';

// French prefixes for metadata and blocks
const PREFIXES: Partial<Record<BlockType | MetadataType, string>> = {
  role: 'Ton rôle est de',
  context: 'Le contexte est',
  goal: "Ton objectif est",
  audience: "L'audience ciblée est",
  output_format: 'Le format attendu est',
  tone_style: 'Le ton et style sont',
  constraint: 'Contrainte:',
  example: 'Exemple:',
};

const PRIMARY_METADATA: MetadataType[] = ['role', 'context', 'goal'];
const SECONDARY_METADATA: MetadataType[] = ['audience', 'output_format', 'tone_style'];
const MULTIPLE_METADATA: MultipleMetadataType[] = ['constraint', 'example'];

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
  if (type && MULTIPLE_METADATA.includes(type as MultipleMetadataType)) {
    return 'jd-text-orange-600 jd-font-semibold';
  }
  return 'jd-text-orange-600 jd-font-semibold';
}

// Enhanced metadata formatting for single types
export function formatMetadataForPrompt(type: SingleMetadataType, value: string): string {
  console.log('FORMAT METADATA FOR PROMPT', type, value);
  const prefix = PREFIXES[type];
  const content = value.trim();
  return prefix ? `${prefix} ${content}` : content;
}

export function formatMetadataForPreview(type: SingleMetadataType, value: string): string {
  const prefix = PREFIXES[type];
  const cls = getHighlightClass(type);
  const content = escapeHtml(value.trim());
  if (!prefix) return content;
  return `<span class="${cls}">${escapeHtml(prefix)}</span> ${content}`;
}

// New functions for multiple metadata types
export function formatMultipleMetadataForPrompt(type: MultipleMetadataType, items: MetadataItem[]): string[] {
  const prefix = PREFIXES[type];
  return items
    .filter(item => item.value.trim())
    .map((item, index) => {
      const content = item.value.trim();
      if (type === 'constraint') {
        return prefix ? `${prefix} ${content}` : content;
      } else if (type === 'example') {
        return prefix ? `${prefix} ${content}` : content;
      }
      return content;
    });
}

export function formatMultipleMetadataForPreview(type: MultipleMetadataType, items: MetadataItem[]): string[] {
  const prefix = PREFIXES[type];
  const cls = getHighlightClass(type);
  
  return items
    .filter(item => item.value.trim())
    .map((item, index) => {
      const content = escapeHtml(item.value.trim());
      if (!prefix) return content;
      
      if (type === 'constraint') {
        return `<span class="${cls}">${escapeHtml(prefix)}</span> ${content}`;
      } else if (type === 'example') {
        return `<span class="${cls}">${escapeHtml(prefix)}</span> ${content}`;
      }
      return content;
    });
}

// Enhanced block formatting (unchanged)
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

// Enhanced function to build complete prompt from metadata and blocks
export function buildCompletePrompt(metadata: PromptMetadata, content = ''): string {
  const parts: string[] = [];

  console.log('metadataaaaaaaa', metadata);
  console.log('contentaaaaaaa', content);

  // Add single metadata values
  PRIMARY_METADATA.forEach(type => {
    console.log('type', type);
    if (!isMultipleMetadataType(type)) {
      const singleType = type as SingleMetadataType;
      const blockId = metadata[singleType];
      const value = blockId ? getBlockContent(blockId) : '';
      console.log('value', value);
      console.log("singleType", singleType);
      if (value?.trim()) {
        parts.push(formatMetadataForPrompt(singleType, value));
      }
    }
  });

  SECONDARY_METADATA.forEach(type => {
    if (!isMultipleMetadataType(type)) {
      const singleType = type as SingleMetadataType;
      const value = metadata.values?.[singleType];
      if (value?.trim()) {
        parts.push(formatMetadataForPrompt(singleType, value));
      }
    }
  });

  // Add multiple metadata values
  if (metadata.constraints && metadata.constraints.length > 0) {
    const constraintTexts = formatMultipleMetadataForPrompt('constraint', metadata.constraints);
    parts.push(...constraintTexts);
  }

  if (metadata.examples && metadata.examples.length > 0) {
    const exampleTexts = formatMultipleMetadataForPrompt('example', metadata.examples);
    parts.push(...exampleTexts);
  }

  if (content.trim()) {
    parts.push(content.trim());
  }

  return parts.filter(Boolean).join('\n\n');
}

// Enhanced function to build HTML preview
export function buildCompletePromptPreview(metadata: PromptMetadata, blocks: Block[]): string {
  const parts: string[] = [];

  // Add single metadata values
  PRIMARY_METADATA.forEach(type => {
    if (!isMultipleMetadataType(type)) {
      const singleType = type as SingleMetadataType;
      const value = metadata.values?.[singleType];
      if (value?.trim()) {
        parts.push(formatMetadataForPreview(singleType, value));
      }
    }
  });

  SECONDARY_METADATA.forEach(type => {
    if (!isMultipleMetadataType(type)) {
      const singleType = type as SingleMetadataType;
      const value = metadata.values?.[singleType];
      if (value?.trim()) {
        parts.push(formatMetadataForPreview(singleType, value));
      }
    }
  });

  // Add multiple metadata values
  if (metadata.constraints && metadata.constraints.length > 0) {
    const constraintHtml = formatMultipleMetadataForPreview('constraint', metadata.constraints);
    parts.push(...constraintHtml);
  }

  if (metadata.examples && metadata.examples.length > 0) {
    const exampleHtml = formatMultipleMetadataForPreview('example', metadata.examples);
    parts.push(...exampleHtml);
  }

  // Add blocks
  blocks.forEach(block => {
    const blockHtml = formatBlockForPreview(block);
    if (blockHtml) {
      parts.push(blockHtml);
    }
  });

  return parts.filter(Boolean).join('<br><br>');
}

// Helper function to count total metadata items
export function countMetadataItems(metadata: PromptMetadata): number {
  let count = 0;

  // Count single metadata
  PRIMARY_METADATA.forEach(type => {
    if (!isMultipleMetadataType(type)) {
      const singleType = type as SingleMetadataType;
      const value = metadata.values?.[singleType];
      if (value?.trim()) count++;
    }
  });

  SECONDARY_METADATA.forEach(type => {
    if (!isMultipleMetadataType(type)) {
      const singleType = type as SingleMetadataType;
      const value = metadata.values?.[singleType];
      if (value?.trim()) count++;
    }
  });

  // Count multiple metadata
  if (metadata.constraints) {
    count += metadata.constraints.filter(item => item.value.trim()).length;
  }

  if (metadata.examples) {
    count += metadata.examples.filter(item => item.value.trim()).length;
  }

  return count;
}

// Helper function to validate metadata completeness
export function validateMetadata(metadata: PromptMetadata): {
  isValid: boolean;
  missingRequired: string[];
  warnings: string[];
} {
  const missingRequired: string[] = [];
  const warnings: string[] = [];

  // Check if at least one primary metadata is filled
  const hasPrimaryMetadata = PRIMARY_METADATA.some(type => {
    if (!isMultipleMetadataType(type)) {
      const singleType = type as SingleMetadataType;
      return metadata.values?.[singleType]?.trim();
    }
    return false;
  });

  if (!hasPrimaryMetadata) {
    missingRequired.push('At least one of: Role, Context, or Goal');
  }

  // Warnings for incomplete multiple metadata
  if (metadata.constraints && metadata.constraints.some(item => !item.value.trim())) {
    warnings.push('Some constraints are empty');
  }

  if (metadata.examples && metadata.examples.some(item => !item.value.trim())) {
    warnings.push('Some examples are empty');
  }

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    warnings
  };
}