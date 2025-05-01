// src/utils/templates/insertPrompt.ts
// Refactored to use PlatformManager

import { getCurrentPlatformDOMUtils } from "@/platforms/PlatformManager";

/**
 * Insert content into the current AI chat platform's input area.
 * Detects platform via PlatformManager and routes to the appropriate handler.
 *
 * @param content The content to insert
 * @returns True if successful, false otherwise
 */
export function insertContentIntoChat(content: string): boolean {
  if (!content) {
    console.error("Jaydai: No content provided for insertion.");
    return false;
  }

  const domUtils = getCurrentPlatformDOMUtils();

  if (!domUtils) {
    console.error("Jaydai: Cannot insert content, unknown or unsupported platform.");
    return false;
  }

  try {
    // Format content before insertion (optional, keep if needed)
    const formattedContent = formatContentForInsertion(content);
    return domUtils.insertPrompt(formattedContent);
  } catch (error) {
    console.error("Jaydai: Error during content insertion process:", error);
    return false;
  }
}

/**
 * Format content for insertion, normalizing line breaks.
 * Kept from the original file, might be universally applicable.
 * @param content Raw content to format
 * @returns Formatted content
 */
export function formatContentForInsertion(content: string): string {
  if (!content) return "";

  // Convert Windows newlines to Unix newlines
  // Normalize excessive newlines (more than 2) to double newlines
  return content.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
}

// Removed detectPlatform and insertContentIntoChatGPT as they are now
// handled by PlatformManager and platform-specific domUtils respectively.
// Also removed the import for claude/insertPrompt.

