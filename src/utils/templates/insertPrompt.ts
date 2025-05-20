// src/utils/templates/insertPrompt.ts (updated)
/**
 * Utils for inserting template content into chat windows
 * Updated to support block-based templates
 */

/**
 * Format content for insertion: normalize newlines and ensure proper spacing
 */
export function formatContentForInsertion(content: string): string {
  if (!content) return '';
  
  // Normalize newlines to just \n
  let normalizedContent = content.replace(/\r\n/g, '\n');
  
  // Ensure content doesn't have excessive newlines
  normalizedContent = normalizedContent.replace(/\n{3,}/g, '\n\n');
  
  return normalizedContent;
}

/**
 * Format block-based content for insertion
 * Combines multiple blocks with appropriate spacing
 */
export function formatBlocksForInsertion(blocks: any[]): string {
  if (!blocks || blocks.length === 0) return '';
  
  // Combine blocks with double newlines between them
  const contentParts = blocks.map(block => {
    if (!block.content) return '';
    return formatContentForInsertion(block.content);
  }).filter(content => content.length > 0);
  
  return contentParts.join('\n\n');
}

/**
 * Insert content into ChatGPT or Claude text area
 */
export function insertContentIntoChat(content: string): boolean {
  try {
    // Find the active textarea 
    // First try for ChatGPT
    let textarea = document.querySelector('textarea[placeholder*="Send a message"]') as HTMLTextAreaElement;
    
    // If no ChatGPT textarea, try for Claude
    if (!textarea) {
      textarea = document.querySelector('textarea[placeholder*="Message Claude"]') as HTMLTextAreaElement;
    }
    
    // If no textarea found, look for contentEditable divs (some newer versions)
    if (!textarea) {
      const contentEditableDiv = document.querySelector('[contenteditable="true"]') as HTMLDivElement;
      if (contentEditableDiv) {
        // Set content to contentEditable div
        contentEditableDiv.innerHTML = content;
        // Trigger input event to ensure it's registered
        contentEditableDiv.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      
      return false;
    }
    
    // Set value and focus
    textarea.value = content;
    textarea.focus();
    
    // Trigger input event to ensure it's registered
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Trigger resize to adjust height
    const resizeEvent = new Event('input', { bubbles: true });
    textarea.dispatchEvent(resizeEvent);
    
    return true;
  } catch (error) {
    console.error('Error inserting template content:', error);
    return false;
  }
}