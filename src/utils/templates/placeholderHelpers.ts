// src/utils/templates/placeholderHelpers.ts - Enhanced with unified preview generation
import { getBlockTextColors } from '@/utils/prompts/blockUtils';

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
 * This is the UNIFIED approach that should be used everywhere
 */
export function addBlockTypeColors(htmlContent: string, isDarkMode: boolean): string {
  // Define patterns for different block types with their exact prefixes
  const patterns = [
    { 
      regex: /(Role:\s*|Ton rôle est de\s*)/gi, 
      blockType: 'role' 
    },
    { 
      regex: /(Contexte:\s*|Le contexte est\s*|Context:\s*)/gi, 
      blockType: 'context' 
    },
    { 
      regex: /(Objectif:\s*|Ton objectif est\s*|Goal:\s*)/gi, 
      blockType: 'goal' 
    },
    { 
      regex: /(Audience cible:\s*|L'audience ciblée est\s*|Audience:\s*)/gi, 
      blockType: 'audience' 
    },
    { 
      regex: /(Format de sortie:\s*|Le format attendu est\s*|Output format:\s*)/gi, 
      blockType: 'output_format' 
    },
    { 
      regex: /(Ton et style:\s*|Le ton et style sont\s*|Tone:\s*|Style:\s*)/gi, 
      blockType: 'tone_style' 
    },
    { 
      regex: /(Contrainte:\s*|Constraint:\s*)/gi, 
      blockType: 'constraint' 
    },
    { 
      regex: /(Exemple:\s*|Example:\s*)/gi, 
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
 * UNIFIED function for generating preview HTML with colors and placeholder highlighting
 * This should be used in ALL preview components for consistency
 */
export function generateUnifiedPreviewHtml(content: string, isDarkMode: boolean): string {
  if (!content?.trim()) {
    return '<span class="jd-text-muted-foreground jd-italic">Your prompt will appear here...</span>';
  }

  // Step 1: Escape HTML
  let htmlContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');

  // Step 2: Add block type colors
  htmlContent = addBlockTypeColors(htmlContent, isDarkMode);

  // Step 3: Add placeholder highlighting
  htmlContent = htmlContent.replace(/\[([^\]]+)\]/g, 
    '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
  );

  return htmlContent;
}

/**
 * Enhanced highlight function specifically for InsertBlockDialog compatibility
 */
export function highlightPlaceholdersWithColors(text: string, isDarkMode: boolean = false): string {
  return generateUnifiedPreviewHtml(text, isDarkMode);
}


/**
 * Extract all placeholders from text content
 */
export function extractPlaceholders(text: string): ExtractedPlaceholder[] {
  if (!text) return [];
  
  const placeholderRegex = /\[([^\]]+)\]/g;
  const placeholders: ExtractedPlaceholder[] = [];
  let match;
  
  while ((match = placeholderRegex.exec(text)) !== null) {
    placeholders.push({
      key: match[1], // The content inside the brackets
      fullMatch: match[0], // The complete match including brackets
      position: match.index
    });
  }
  
  return placeholders;
}

/**
 * Replace placeholders in text with provided values
 */
export function replacePlaceholders(
  text: string, 
  placeholderMap: Record<string, string>
): string {
  if (!text || !placeholderMap) return text;
  
  let result = text;
  
  // Replace each placeholder with its value
  Object.entries(placeholderMap).forEach(([key, value]) => {
    if (value && value.trim()) {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\[${escapedKey}\\]`, 'g');
      result = result.replace(regex, () => value);
    }
  });
  
  return result;
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

  if (!text?.trim()) {
    return '<span class="jd-text-muted-foreground jd-italic">Your prompt will appear here...</span>';
  }

  // Use the unified function for consistency
  if (addColors && shouldHighlight) {
    return generateUnifiedPreviewHtml(text, isDarkMode);
  }

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

  return formatted;
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
 * This is the MAIN function that should be used everywhere
 */
export function buildEnhancedPreview(content: string, isDarkMode: boolean): string {
  return generateUnifiedPreviewHtml(content, isDarkMode);
}