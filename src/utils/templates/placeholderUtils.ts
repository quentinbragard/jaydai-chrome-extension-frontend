// src/utils/templates/placeholderUtils.ts
// Enhanced utilities for handling text insertion and placeholder highlighting

/**
 * Insert text at the current cursor position in the target element
 * @param targetElement - The element to insert text into
 * @param text - The text to insert
 * @param savedCursorPos - Optional saved cursor position to restore
 */
export function insertTextAtCursor(targetElement: HTMLElement, text: string, savedCursorPos?: number): void {
  if (!targetElement || !text) {
    console.warn('insertTextAtCursor: missing targetElement or text');
    return;
  }

  console.log('insertTextAtCursor called:', { 
    element: targetElement.tagName, 
    text: text.substring(0, 50) + '...', 
    savedCursorPos,
    elementValue: targetElement instanceof HTMLTextAreaElement ? targetElement.value.substring(0, 50) + '...' : 'N/A'
  });

  // Try platform-specific insertion first
  const success = tryPlatformSpecificInsertion(targetElement, text, savedCursorPos);
  
  if (success) {
    console.log('Platform-specific insertion successful');
    return;
  }

  console.warn('Platform-specific insertion failed, trying fallback methods');

  // Original implementation as fallback
  // Handle textarea elements
  if (targetElement instanceof HTMLTextAreaElement) {
    // Use saved cursor position or current selection
    const start = savedCursorPos !== undefined ? savedCursorPos : (targetElement.selectionStart || 0);
    const end = savedCursorPos !== undefined ? savedCursorPos : (targetElement.selectionEnd || 0);
    const value = targetElement.value;
    
    console.log('Textarea insertion:', { start, end, valueLength: value.length });
    
    // Insert text at cursor position
    const newValue = value.substring(0, start) + text + value.substring(end);
    targetElement.value = newValue;
    
    // Set cursor position after inserted text
    const newCursorPos = start + text.length;
    targetElement.setSelectionRange(newCursorPos, newCursorPos);
    
    // Dispatch input event to trigger any listeners
    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
    targetElement.focus();
    
    console.log('Textarea insertion complete:', { newCursorPos, newValueLength: newValue.length });
    return;
  }

  // Handle contenteditable elements
  if (targetElement.isContentEditable) {
    console.log('Contenteditable insertion');
    
    // Focus the element first
    targetElement.focus();
    
    // Try to restore cursor position if we have savedCursorPos
    if (savedCursorPos !== undefined) {
      const textContent = targetElement.textContent || '';
      const range = document.createRange();
      const selection = window.getSelection();
      
      // Find the text node and position
      const walker = document.createTreeWalker(
        targetElement,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let currentPos = 0;
      let targetNode = walker.nextNode();
      
      while (targetNode && currentPos + (targetNode.textContent?.length || 0) < savedCursorPos) {
        currentPos += targetNode.textContent?.length || 0;
        targetNode = walker.nextNode();
      }
      
      if (targetNode) {
        const offsetInNode = savedCursorPos - currentPos;
        range.setStart(targetNode, Math.min(offsetInNode, targetNode.textContent?.length || 0));
        range.setEnd(targetNode, Math.min(offsetInNode, targetNode.textContent?.length || 0));
      } else {
        // Fallback to end of content
        range.selectNodeContents(targetElement);
        range.collapse(false);
      }
      
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    
    const selection = window.getSelection();
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Delete any selected content
      range.deleteContents();
      
      // Create text node and insert
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      
      // Move cursor to end of inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Dispatch input event
      targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      targetElement.focus();
      
      console.log('Contenteditable insertion complete');
      return;
    } else {
      // Fallback: append to end if no selection
      console.log('Contenteditable fallback: appending to end');
      targetElement.textContent = (targetElement.textContent || '') + text;
      targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      targetElement.focus();
      return;
    }
  }

  // Fallback for other input elements
  if (targetElement instanceof HTMLInputElement) {
    const start = savedCursorPos !== undefined ? savedCursorPos : (targetElement.selectionStart || 0);
    const end = savedCursorPos !== undefined ? savedCursorPos : (targetElement.selectionEnd || 0);
    const value = targetElement.value;
    
    const newValue = value.substring(0, start) + text + value.substring(end);
    targetElement.value = newValue;
    
    const newCursorPos = start + text.length;
    targetElement.setSelectionRange(newCursorPos, newCursorPos);
    
    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
    targetElement.focus();
    
    console.log('Input insertion complete');
    return;
  }

  // If all specific methods fail, try a more aggressive approach
  console.warn('All insertion methods failed, trying fallback approach');
  
  // Last resort: try to find any visible text input and append there
  const fallbackSelectors = [
    'textarea:focus',
    'input[type="text"]:focus', 
    '[contenteditable="true"]:focus',
    'textarea',
    'input[type="text"]',
    '[contenteditable="true"]'
  ];
  
  for (const selector of fallbackSelectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && isElementVisible(element)) {
      if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
        const currentValue = element.value;
        element.value = currentValue + text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.focus();
        console.log('Fallback insertion successful into:', selector);
        return;
      } else if (element.isContentEditable) {
        element.textContent = (element.textContent || '') + text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.focus();
        console.log('Fallback insertion successful into:', selector);
        return;
      }
    }
  }
  
  console.error('Complete failure: Unable to insert text anywhere');
}

/**
 * Platform-specific insertion logic
 */
function tryPlatformSpecificInsertion(targetElement: HTMLElement, text: string, savedCursorPos?: number): boolean {
  const hostname = window.location.hostname;
  
  // Claude.ai specific handling
  if (hostname.includes('claude.ai') && targetElement.isContentEditable) {
    console.log('Attempting Claude-specific insertion');
    
    targetElement.focus();
    
    // Try to restore cursor position for Claude
    if (typeof savedCursorPos === 'number') {
      const selection = window.getSelection();
      const range = document.createRange();
      
      const textContent = targetElement.textContent || '';
      if (savedCursorPos <= textContent.length) {
        const walker = document.createTreeWalker(targetElement, NodeFilter.SHOW_TEXT, null);
        
        let currentPos = 0;
        let targetNode = walker.nextNode();
        
        while (targetNode && currentPos + (targetNode.textContent?.length || 0) < savedCursorPos) {
          currentPos += targetNode.textContent?.length || 0;
          targetNode = walker.nextNode();
        }
        
        if (targetNode) {
          const offsetInNode = savedCursorPos - currentPos;
          range.setStart(targetNode, Math.min(offsetInNode, targetNode.textContent?.length || 0));
          range.setEnd(targetNode, Math.min(offsetInNode, targetNode.textContent?.length || 0));
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    }

    // Try execCommand first (works well with Claude)
    try {
      if (document.execCommand) {
        const success = document.execCommand('insertText', false, text);
        if (success) {
          console.log('Claude insertion successful via execCommand');
          return true;
        }
      }
    } catch (e) {
      console.log('execCommand failed for Claude, trying manual insertion');
    }
  }
  
  // ChatGPT specific handling
  if ((hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) && targetElement instanceof HTMLTextAreaElement) {
    console.log('Attempting ChatGPT-specific insertion');
    
    const start = savedCursorPos !== undefined ? savedCursorPos : (targetElement.selectionStart || 0);
    const end = savedCursorPos !== undefined ? savedCursorPos : (targetElement.selectionEnd || 0);
    const value = targetElement.value;
    
    const newValue = value.substring(0, start) + text + value.substring(end);
    targetElement.value = newValue;
    
    const newCursorPos = start + text.length;
    targetElement.setSelectionRange(newCursorPos, newCursorPos);
    
    // Important: ChatGPT needs both 'input' and 'change' events
    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
    targetElement.dispatchEvent(new Event('change', { bubbles: true }));
    targetElement.focus();
    
    console.log('ChatGPT insertion successful');
    return true;
  }
  
  return false;
}

/**
 * Insert text into prompt area (legacy function for template insertion - replaces content)
 * @param text - The text to insert
 */
export function insertIntoPromptArea(text: string): void {
  console.log('insertIntoPromptArea called with text length:', text.length);
  
  // This function is for template insertion which should replace content
  // Find the active prompt input
  const selectors = [
    'textarea[data-id="root"]', // ChatGPT
    'div[contenteditable="true"]', // Claude
    'textarea[placeholder*="Message"]', // Mistral
    'textarea[placeholder*="Ask Copilot"]', // Copilot
    'textarea', // Fallback
    'div[contenteditable]' // Fallback contenteditable
  ];

  let targetElement: HTMLElement | null = null;

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      if (element instanceof HTMLElement && isElementVisible(element)) {
        targetElement = element;
        console.log('Found target element:', selector, targetElement);
        break;
      }
    }
    if (targetElement) break;
  }

  if (!targetElement) {
    console.warn('Could not find prompt input element');
    return;
  }

  // For templates, replace the entire content
  if (targetElement instanceof HTMLTextAreaElement) {
    targetElement.value = text;
    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
    targetElement.focus();
    console.log('Template inserted into textarea');
  } else if (targetElement.isContentEditable) {
    targetElement.textContent = text;
    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
    targetElement.focus();
    console.log('Template inserted into contenteditable');
  } else if (targetElement instanceof HTMLInputElement) {
    targetElement.value = text;
    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
    targetElement.focus();
    console.log('Template inserted into input');
  }
}

/**
 * Check if an element is visible and interactable
 */
function isElementVisible(element: HTMLElement): boolean {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  const isVisible = (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    element.offsetParent !== null
  );
  
  console.log('Element visibility check:', { 
    element: element.tagName, 
    isVisible, 
    rect: { width: rect.width, height: rect.height },
    visibility: style.visibility,
    display: style.display
  });
  
  return isVisible;
}

/**
 * Highlight placeholders in HTML content
 * @param content - The HTML content to process
 * @returns HTML with highlighted placeholders
 */
export function highlightPlaceholders(content: string): string {
  if (!content) return content;
  
  return content.replace(
    /\[(.*?)\]/g, 
    '<span class="jd-bg-yellow-300 jd-text-yellow-900 jd-font-bold jd-px-1 jd-rounded jd-inline-block jd-my-0.5">[$1]</span>'
  );
}

/**
 * Extract placeholders from text content
 * @param content - The text content to search
 * @returns Array of unique placeholder strings
 */
export function extractPlaceholders(content: string): string[] {
  if (!content) return [];
  
  const placeholderRegex = /\[(.*?)\]/g;
  const matches = [...content.matchAll(placeholderRegex)];
  const uniquePlaceholders = new Set(matches.map(match => match[0]));
  
  return Array.from(uniquePlaceholders);
}

/**
 * Replace placeholders in content with provided values
 * @param content - The content containing placeholders
 * @param values - Object mapping placeholder names to values
 * @returns Content with placeholders replaced
 */
export function replacePlaceholders(content: string, values: Record<string, string>): string {
  if (!content) return content;
  
  let result = content;
  
  Object.entries(values).forEach(([placeholder, value]) => {
    // Handle both [placeholder] and placeholder formats
    const normalizedKey = placeholder.startsWith('[') && placeholder.endsWith(']') 
      ? placeholder 
      : `[${placeholder}]`;
    
    const regex = new RegExp(escapeRegExp(normalizedKey), 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get the current cursor position in a text area or input
 * @param element - The input element
 * @returns Object with start and end positions
 */
export function getCursorPosition(element: HTMLTextAreaElement | HTMLInputElement): { start: number; end: number } {
  return {
    start: element.selectionStart || 0,
    end: element.selectionEnd || 0
  };
}

/**
 * Set cursor position in a text area or input
 * @param element - The input element
 * @param position - The position to set (or start/end for range)
 */
export function setCursorPosition(
  element: HTMLTextAreaElement | HTMLInputElement, 
  position: number | { start: number; end: number }
): void {
  if (typeof position === 'number') {
    element.setSelectionRange(position, position);
  } else {
    element.setSelectionRange(position.start, position.end);
  }
  element.focus();
}