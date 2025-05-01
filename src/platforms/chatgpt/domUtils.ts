// src/platforms/chatgpt/domUtils.ts
import { CHATGPT_SELECTORS } from "./config";

/**
 * Insert content into ChatGPT textarea
 * @param content Content to insert
 * @returns True if successful, false otherwise
 */
export function insertPrompt(content: string): boolean {
  if (!content) {
    console.error("Jaydai: No content to insert into ChatGPT");
    return false;
  }

  try {
    // Find the textarea using the selector from config
    const textarea = document.querySelector<HTMLTextAreaElement | HTMLElement>(
      CHATGPT_SELECTORS.promptTextarea
    );
    if (!textarea) {
      console.error("Jaydai: Could not find ChatGPT textarea element using selector:", CHATGPT_SELECTORS.promptTextarea);
      return false;
    }

    // Normalize content (preserve all characters including quotes)
    const normalizedContent = content.replace(/\r\n/g, "\n");

    // Method 1: Standard textarea approach
    try {
      textarea.focus();

      if (textarea instanceof HTMLTextAreaElement) {
        // Set the value directly
        textarea.value = normalizedContent;

        // Trigger input event to notify React/ChatGPT of the change
        textarea.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));

        // Position cursor at the end
        textarea.selectionStart = textarea.selectionEnd = normalizedContent.length;

        // Adjust textarea height if needed (ChatGPT specific)
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;

        return true;
      }

      // For contenteditable divs (less common now for ChatGPT, but keep as fallback)
      if (textarea instanceof HTMLElement && textarea.isContentEditable) {
        // Properly escape HTML entities
        const escapeHTML = (str: string) => {
          return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        };

        // Generate HTML paragraphs with proper escaping
        const paragraphs = normalizedContent.split("\n");
        const paragraphsHTML = paragraphs
          .map((p) => `<p>${escapeHTML(p) || "<br>"}</p>`)
          .join("");

        // Set content directly
        textarea.innerHTML = paragraphsHTML;

        // Trigger input event
        textarea.dispatchEvent(new Event("input", { bubbles: true }));

        return true;
      }
    } catch (e) {
      console.warn("Jaydai: Primary insertion method failed for ChatGPT:", e);
      // Continue to fallback methods if needed
    }

    // Method 2: document.execCommand approach (Fallback)
    try {
      textarea.focus();
      // Note: execCommand is deprecated but might work in some contexts
      if (document.execCommand("insertText", false, normalizedContent)) {
         console.log("Jaydai: Used execCommand fallback for ChatGPT insertion.");
         return true;
      }
    } catch (e) {
      console.warn("Jaydai: execCommand fallback method failed for ChatGPT:", e);
    }

    console.error("Jaydai: All insertion methods failed for ChatGPT");
    return false;
  } catch (error) {
    console.error("Jaydai: Error inserting content into ChatGPT:", error);
    return false;
  }
}

// Add other ChatGPT-specific DOM utility functions here if needed

