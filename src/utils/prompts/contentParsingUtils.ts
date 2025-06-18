// src/utils/prompts/contentParsingUtils.ts
import { PromptMetadata } from '@/types/prompts/metadata';
import { buildPromptPart } from '@/utils/prompts/blockUtils';

interface ParsedSection {
  type: 'metadata' | 'constraint' | 'example' | 'content';
  metadataType?: string;
  blockId?: number;
  itemId?: string;
  content: string;
  originalContent?: string;
}

/**
 * Parse a complete prompt text into its constituent sections
 */
export function parsePromptSections(
  completeText: string,
  metadata: PromptMetadata,
  blockMap: Record<number, string> = {}
): ParsedSection[] {
  const sections = completeText.split(/\n{2,}/);
  const parsedSections: ParsedSection[] = [];
  let sectionIndex = 0;

  // Helper function to check if a section matches a prefix pattern and extract content
  const matchesPrefix = (section: string, type: string): { matches: boolean; content: string } => {
    // Get all possible prefix patterns for this type
    const prefixPatterns = getPrefixPatterns(type);
    
    for (const prefix of prefixPatterns) {
      if (section.startsWith(prefix)) {
        return {
          matches: true,
          content: section.slice(prefix.length).trim()
        };
      }
    }
    
    return { matches: false, content: section.trim() };
  };

  // Helper to get all possible prefix patterns for a type
  const getPrefixPatterns = (type: string): string[] => {
    const patterns: string[] = [];
    
    // Get the base prefix from buildPromptPart
    const basePrefix = buildPromptPart(type as any, '');
    if (basePrefix) {
      // Add various forms of the prefix to handle different formatting
      patterns.push(basePrefix); // Original: "Role:\n "
      patterns.push(basePrefix.trim()); // Trimmed: "Role:"
      patterns.push(basePrefix.replace(/\s+/g, ' ')); // Normalized spaces: "Role: "
      patterns.push(basePrefix.replace(/\n\s*/, ' ')); // Newline to space: "Role: "
      patterns.push(basePrefix.replace(/:\s*\n\s*/, ': ')); // Colon space: "Role: "
    }
    
    // Sort by length (longest first) to match most specific patterns first
    return patterns.filter(Boolean).sort((a, b) => b.length - a.length);
  };

  // Process metadata sections
  const metadataTypes = ['role', 'context', 'goal', 'audience', 'output_format', 'tone_style'];
  
  for (const type of metadataTypes) {
    const blockId = (metadata as any)[type];
    if (blockId && blockId !== 0 && sectionIndex < sections.length) {
      const section = sections[sectionIndex];
      const { matches, content } = matchesPrefix(section, type);
      
      // Accept the section if it matches the expected type or if it's the first section
      if (matches || sectionIndex === 0) {
        parsedSections.push({
          type: 'metadata',
          metadataType: type,
          blockId,
          content,
          originalContent: blockMap[blockId] || ''
        });
        sectionIndex++;
      }
    }
  }

  // Process constraint sections
  if (metadata.constraints) {
    for (const constraint of metadata.constraints) {
      if (constraint.blockId && sectionIndex < sections.length) {
        const section = sections[sectionIndex];
        const { matches, content } = matchesPrefix(section, 'constraint');
        
        parsedSections.push({
          type: 'constraint',
          blockId: constraint.blockId,
          itemId: constraint.id,
          content,
          originalContent: blockMap[constraint.blockId] || constraint.value
        });
        sectionIndex++;
      }
    }
  }

  // Process example sections
  if (metadata.examples) {
    for (const example of metadata.examples) {
      if (example.blockId && sectionIndex < sections.length) {
        const section = sections[sectionIndex];
        const { matches, content } = matchesPrefix(section, 'example');
        
        parsedSections.push({
          type: 'example',
          blockId: example.blockId,
          itemId: example.id,
          content,
          originalContent: blockMap[example.blockId] || example.value
        });
        sectionIndex++;
      }
    }
  }

  // Remaining sections are content
  if (sectionIndex < sections.length) {
    const remainingContent = sections.slice(sectionIndex).join('\n\n');
    if (remainingContent.trim()) {
      parsedSections.push({
        type: 'content',
        content: remainingContent.trim()
      });
    }
  }

  return parsedSections;
}

/**
 * Reconstruct a complete prompt from parsed sections
 */
export function reconstructPromptFromSections(
  sections: ParsedSection[],
  metadata: PromptMetadata
): string {
  const promptParts: string[] = [];

  for (const section of sections) {
    if (section.type === 'metadata' && section.metadataType) {
      const prefix = buildPromptPart(section.metadataType as any, '');
      const fullContent = prefix ? `${prefix.trim()} ${section.content}` : section.content;
      promptParts.push(fullContent);
    } else if (section.type === 'constraint') {
      const prefix = buildPromptPart('constraint', '');
      const fullContent = prefix ? `${prefix.trim()} ${section.content}` : section.content;
      promptParts.push(fullContent);
    } else if (section.type === 'example') {
      const prefix = buildPromptPart('example', '');
      const fullContent = prefix ? `${prefix.trim()} ${section.content}` : section.content;
      promptParts.push(fullContent);
    } else if (section.type === 'content') {
      promptParts.push(section.content);
    }
  }

  return promptParts.filter(Boolean).join('\n\n');
}

/**
 * Extract block content overrides from parsed sections
 */
export function extractBlockOverrides(
  sections: ParsedSection[]
): Record<number, string> {
  const overrides: Record<number, string> = {};

  for (const section of sections) {
    if (section.blockId && section.originalContent !== undefined) {
      // Only add override if content has changed
      if (section.content !== section.originalContent) {
        overrides[section.blockId] = section.content;
      }
    }
  }

  return overrides;
}

/**
 * Extract main content from parsed sections
 */
export function extractMainContent(sections: ParsedSection[]): string {
  const contentSections = sections.filter(s => s.type === 'content');
  return contentSections.map(s => s.content).join('\n\n');
}

/**
 * Validate parsed sections for completeness and consistency
 */
export function validateParsedSections(
  sections: ParsedSection[],
  metadata: PromptMetadata
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if all expected metadata sections are present
  const metadataTypes = ['role', 'context', 'goal', 'audience', 'output_format', 'tone_style'];
  const foundMetadataTypes = sections
    .filter(s => s.type === 'metadata')
    .map(s => s.metadataType);

  for (const type of metadataTypes) {
    const blockId = (metadata as any)[type];
    if (blockId && blockId !== 0 && !foundMetadataTypes.includes(type)) {
      warnings.push(`Expected ${type} section not found in parsed content`);
    }
  }

  // Check constraint sections
  const foundConstraints = sections.filter(s => s.type === 'constraint').length;
  const expectedConstraints = metadata.constraints?.length || 0;
  if (foundConstraints !== expectedConstraints) {
    warnings.push(`Expected ${expectedConstraints} constraints, found ${foundConstraints}`);
  }

  // Check example sections
  const foundExamples = sections.filter(s => s.type === 'example').length;
  const expectedExamples = metadata.examples?.length || 0;
  if (foundExamples !== expectedExamples) {
    warnings.push(`Expected ${expectedExamples} examples, found ${foundExamples}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Smart content parser that handles various prompt formats
 */
export function smartParsePromptContent(
  completeText: string,
  metadata: PromptMetadata,
  blockMap: Record<number, string> = {}
): {
  sections: ParsedSection[];
  blockOverrides: Record<number, string>;
  mainContent: string;
  validation: ReturnType<typeof validateParsedSections>;
} {
  const sections = parsePromptSections(completeText, metadata, blockMap);
  const blockOverrides = extractBlockOverrides(sections);
  const mainContent = extractMainContent(sections);
  const validation = validateParsedSections(sections, metadata);

  return {
    sections,
    blockOverrides,
    mainContent,
    validation
  };
}

/**
 * Update specific section content and reconstruct the prompt
 */
export function updateSectionContent(
  completeText: string,
  metadata: PromptMetadata,
  blockMap: Record<number, string>,
  updates: Array<{
    type: 'metadata' | 'constraint' | 'example' | 'content';
    identifier?: string | number; // metadataType, blockId, or itemId
    newContent: string;
  }>
): string {
  const sections = parsePromptSections(completeText, metadata, blockMap);

  // Apply updates
  for (const update of updates) {
    const targetSection = sections.find(section => {
      if (update.type === 'metadata') {
        return section.type === 'metadata' && section.metadataType === update.identifier;
      } else if (update.type === 'constraint') {
        return section.type === 'constraint' && section.blockId === update.identifier;
      } else if (update.type === 'example') {
        return section.type === 'example' && section.blockId === update.identifier;
      } else if (update.type === 'content') {
        return section.type === 'content';
      }
      return false;
    });

    if (targetSection) {
      targetSection.content = update.newContent;
    }
  }

  return reconstructPromptFromSections(sections, metadata);
}