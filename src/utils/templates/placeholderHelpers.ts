// src/utils/templates/placeholderHelpers.ts - Enhanced with block colors
import { getBlockTextColors } from '@/components/prompts/blocks/blockUtils';

export interface PlaceholderMatch {
  key: string;
  value: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Enhanced placeholder highlighting function with block type colors
 * Used in BasicEditor, AdvancedEditor, and InsertBlockDialog
 */
export function highlightPlaceholders(text: string, options?: { 
  addColors?: boolean; 
  isDarkMode?: boolean 
}): string {
  if (!text) {
    return '<span class="jd-text-muted-foreground jd-italic">Your prompt will appear here...</span>';
  }

  const { addColors = false, isDarkMode = false } = options || {};

  let htmlContent = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');

  // Add block type colors if requested
  if (addColors) {
    htmlContent = addBlockTypeColors(htmlContent, isDarkMode);
  }

  // Apply placeholder highlighting
  htmlContent = htmlContent.replace(/\[([^\]]+)\]/g, 
    '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
  );

  return htmlContent;
}

/**
 * Add block type colors to content based on common patterns
 */
export function addBlockTypeColors(htmlContent: string, isDarkMode: boolean): string {
  // Define patterns for different block types
  const patterns = [
    { 
      regex: /(Ton rôle est de|Role:|Rôle:)/gi, 
      blockType: 'role' 
    },
    { 
      regex: /(Le contexte est|Context:|Contexte:)/gi, 
      blockType: 'context' 
    },
    { 
      regex: /(Ton objectif est|Goal:|Objectif:)/gi, 
      blockType: 'goal' 
    },
    { 
      regex: /(L'audience ciblée est|Audience:|Public cible:)/gi, 
      blockType: 'audience' 
    },
    { 
      regex: /(Le format attendu est|Output format:|Format de sortie:)/gi, 
      blockType: 'output_format' 
    },
    { 
      regex: /(Le ton et style sont|Tone:|Style:)/gi, 
      blockType: 'tone_style' 
    },
    { 
      regex: /(Contrainte:|Constraint:)/gi, 
      blockType: 'constraint' 
    },
    { 
      regex: /(Exemple:|Example:)/gi, 
      blockType: 'example' 
    }
  ];

  // Apply colors to each pattern
  patterns.forEach(({ regex, blockType }) => {
    const colorClass = getBlockTextColors(blockType as any, isDarkMode);
    htmlContent = htmlContent.replace(regex, (match) => {
      return `<span class="${colorClass} jd-font-semibold">${match}</span>`;
    });
  });

  return htmlContent;
}

/**
 * Enhanced highlight function specifically for InsertBlockDialog compatibility
 */
export function highlightPlaceholdersWithColors(text: string, isDarkMode: boolean = false): string {
  return highlightPlaceholders(text, { addColors: true, isDarkMode });
}

/**
 * Extract placeholders from text content
 */
export function extractPlaceholders(text: string): PlaceholderMatch[] {
  const placeholders: PlaceholderMatch[] = [];
  const regex = /\[([^\]]+)\]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    placeholders.push({
      key: match[1],
      value: '', // Default empty value
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  return placeholders;
}

/**
 * Replace placeholders in text with their values
 */
export function replacePlaceholders(text: string, placeholderValues: Record<string, string>): string {
  return text.replace(/\[([^\]]+)\]/g, (match, key) => {
    return placeholderValues[key] || match;
  });
}

/**
 * Get unique placeholder keys from text
 */
export function getUniquePlaceholderKeys(text: string): string[] {
  const keys = new Set<string>();
  const regex = /\[([^\]]+)\]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    keys.add(match[1]);
  }

  return Array.from(keys);
}

/**
 * Validate placeholder syntax in text
 */
export function validatePlaceholderSyntax(text: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  let isValid = true;

  // Check for unmatched brackets
  const openBrackets = (text.match(/\[/g) || []).length;
  const closeBrackets = (text.match(/\]/g) || []).length;

  if (openBrackets !== closeBrackets) {
    errors.push('Unmatched brackets in placeholders');
    isValid = false;
  }

  // Check for empty placeholders
  if (text.includes('[]')) {
    errors.push('Empty placeholders found');
    isValid = false;
  }

  // Check for nested brackets
  const nestedRegex = /\[[^\[\]]*\[[^\]]*\]/;
  if (nestedRegex.test(text)) {
    errors.push('Nested brackets are not allowed in placeholders');
    isValid = false;
  }

  return { isValid, errors };
}

/**
 * Format text for display in preview components with enhanced color support
 */
export function formatPreviewText(text: string, options?: {
  highlightPlaceholders?: boolean;
  escapeHtml?: boolean;
  preserveLineBreaks?: boolean;
  addColors?: boolean;
  isDarkMode?: boolean;
}): string {
  const {
    highlightPlaceholders: shouldHighlight = true,
    escapeHtml = true,
    preserveLineBreaks = true,
    addColors = false,
    isDarkMode = false
  } = options || {};

  let formatted = text;

  if (escapeHtml) {
    formatted = formatted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  if (preserveLineBreaks) {
    formatted = formatted.replace(/\n/g, '<br>');
  }

  if (addColors) {
    formatted = addBlockTypeColors(formatted, isDarkMode);
  }

  if (shouldHighlight) {
    formatted = formatted.replace(/\[([^\]]+)\]/g, 
      '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
    );
  }

  return formatted || '<span class="jd-text-muted-foreground jd-italic">Your prompt will appear here...</span>';
}

/**
 * Convert placeholders to template variables for advanced processing
 */
export function placeholdersToVariables(text: string): { text: string; variables: Record<string, string> } {
  const variables: Record<string, string> = {};
  let index = 0;
  
  const processedText = text.replace(/\[([^\]]+)\]/g, (match, key) => {
    const variableName = `var_${index++}`;
    variables[variableName] = key;
    return `{{${variableName}}}`;
  });

  return { text: processedText, variables };
}

/**
 * Enhanced function to check if text contains placeholders
 */
export function hasPlaceholders(text: string): boolean {
  return /\[[^\]]+\]/.test(text);
}

/**
 * Get placeholder statistics for text
 */
export function getPlaceholderStats(text: string): {
  count: number;
  unique: number;
  keys: string[];
  duplicates: string[];
} {
  const allMatches = extractPlaceholders(text);
  const keys = allMatches.map(p => p.key);
  const uniqueKeys = Array.from(new Set(keys));
  const duplicates = keys.filter((key, index, arr) => arr.indexOf(key) !== index);

  return {
    count: allMatches.length,
    unique: uniqueKeys.length,
    keys: uniqueKeys,
    duplicates: Array.from(new Set(duplicates))
  };
}

/**
 * Build enhanced preview content with colors for any editor
 */
export function buildEnhancedPreview(content: string, isDarkMode: boolean): string {
  if (!content.trim()) {
    return '<span class="jd-text-muted-foreground jd-italic">Your prompt will appear here...</span>';
  }

  // Process the content with colors and placeholder highlighting
  return formatPreviewText(content, {
    highlightPlaceholders: true,
    escapeHtml: true,
    preserveLineBreaks: true,
    addColors: true,
    isDarkMode
  });
}