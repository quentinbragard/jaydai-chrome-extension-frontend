import { PromptMetadata } from '@/types/prompts/metadata';
import {
  buildCompletePreview,
  buildCompletePreviewWithBlocks,
  buildCompletePreviewHtml,
  buildCompletePreviewHtmlWithBlocks
} from '@/utils/templates/promptPreviewUtils';

/**
 * Build the final prompt text from metadata and content.
 * Optionally resolves block references using the provided block map.
 */
export function formatPromptText(
  metadata: PromptMetadata,
  content: string,
  blockMap?: Record<number, string>
): string {
  if (blockMap) {
    return buildCompletePreviewWithBlocks(metadata, content, blockMap);
  }
  return buildCompletePreview(metadata, content);
}

/**
 * Build the final prompt HTML for preview.
 * Optionally resolves block references using the provided block map.
 */
export function formatPromptHtml(
  metadata: PromptMetadata,
  content: string,
  isDark: boolean,
  blockMap?: Record<number, string>
): string {
  if (blockMap) {
    return buildCompletePreviewHtmlWithBlocks(metadata, content, blockMap, isDark);
  }
  return buildCompletePreviewHtml(metadata, content, isDark);
}
