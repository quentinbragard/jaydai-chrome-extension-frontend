// src/utils/templates/placeholderHelpers.ts - Enhanced version for consistency
export interface PlaceholderMatch {
  key: string;
  value: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Enhanced placeholder highlighting function that's consistent across all editors
 * Used in BasicEditor, AdvancedEditor, and InsertBlockDialog
 */
export function highlightPlaceholders(text: string): string {
  if (!text) {
    return '<span class="jd-text-muted-foreground jd-italic">Your prompt will appear here...</span>';
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>')
    .replace(/\[([^\]]+)\]/g, 
      '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
    );
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
 * Format text for display in preview components
 * This ensures consistent formatting across all editors
 */
export function formatPreviewText(text: string, options?: {
  highlightPlaceholders?: boolean;
  escapeHtml?: boolean;
  preserveLineBreaks?: boolean;
}): string {
  const {
    highlightPlaceholders: shouldHighlight = true,
    escapeHtml = true,
    preserveLineBreaks = true
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