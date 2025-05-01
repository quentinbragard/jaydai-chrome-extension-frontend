// src/platforms/claude/domUtils.ts
import { CLAUDE_SELECTORS } from "./config";

/**
 * Insert content into Claude's prompt input area.
 * Based on the original logic in src/utils/claude/insertPrompt.ts
 * @param content Content to insert
 * @returns True if successful, false otherwise
 */
export function insertPrompt(content: string): boolean {
  if (!content) {
    console.error("Jaydai: No content to insert into Claude");
    return false;
  }

  try {
    // Find the prompt input area using the selector from config
    const promptInput = document.querySelector<HTMLElement>(
      CLAUDE_SELECTORS.promptTextarea
    );

    if (!promptInput) {
      console.error("Jaydai: Could not find Claude prompt input element using selector:", CLAUDE_SELECTORS.promptTextarea);
      return false;
    }

    // Claude uses a contenteditable div, often with complex internal structure.
    // Setting innerText or textContent is usually the most reliable way.

    // Clear existing content (optional, depends on desired behavior)
    // promptInput.innerText = ''; // Uncomment if clearing is needed

    // Insert the new content
    promptInput.focus(); // Focus the element first

    // Method 1: Set innerText (often works well for contenteditable)
    try {
        promptInput.innerText = content;
        // Trigger an input event to notify Claude's framework of the change
        promptInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        console.log("Jaydai: Inserted content into Claude using innerText.");
        return true;
    } catch (e) {
        console.warn("Jaydai: Failed to insert content using innerText for Claude:", e);
    }

    // Method 2: Fallback using document.execCommand (less reliable, deprecated)
    try {
        if (document.execCommand('insertText', false, content)) {
            console.log("Jaydai: Used execCommand fallback for Claude insertion.");
            return true;
        }
    } catch (e) {
        console.warn("Jaydai: execCommand fallback method failed for Claude:", e);
    }

    console.error("Jaydai: All insertion methods failed for Claude");
    return false;

  } catch (error) {
    console.error("Jaydai: Error inserting content into Claude:", error);
    return false;
  }
}

// Add other Claude-specific DOM utility functions here if needed

