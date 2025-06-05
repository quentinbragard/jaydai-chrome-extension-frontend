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

  // Prevent multiple simultaneous insertions
  if ((window as any)._jaydaiInserting) {
    console.warn('Insertion already in progress, skipping');
    return;
  }

  (window as any)._jaydaiInserting = true;

  try {
    console.log('insertTextAtCursor called:', { 
      element: targetElement.tagName, 
      text: text.substring(0, 50) + '...', 
      savedCursorPos,
      elementValue: targetElement instanceof HTMLTextAreaElement ? targetElement.value.substring(0, 50) + '...' : 'N/A'
    });

    // Validate and sanitize cursor position
    const sanitizedCursorPos = sanitizeCursorPosition(targetElement, savedCursorPos);
    console.log('Sanitized cursor position:', sanitizedCursorPos);

    // Try platform-specific insertion first
    const success = tryPlatformSpecificInsertion(targetElement, text, sanitizedCursorPos);
    
    if (success) {
      console.log('Platform-specific insertion successful');
      return;
    }

    console.warn('Platform-specific insertion failed, trying fallback methods');

    // Original implementation as fallback
    // Handle textarea elements
    if (targetElement instanceof HTMLTextAreaElement) {
      insertIntoTextarea(targetElement, text, sanitizedCursorPos);
      return;
    }

    // Handle contenteditable elements
    if (targetElement.isContentEditable) {
      insertIntoContentEditable(targetElement, text, sanitizedCursorPos);
      return;
    }

    // Fallback for other input elements
    if (targetElement instanceof HTMLInputElement) {
      insertIntoInput(targetElement, text, sanitizedCursorPos);
      return;
    }

    // If all specific methods fail, try a more aggressive approach
    console.warn('All insertion methods failed, trying fallback approach');
    tryFallbackInsertion(text);
  } finally {
    // Always reset the insertion flag
    setTimeout(() => {
      (window as any)._jaydaiInserting = false;
    }, 50);
  }
}

/**
 * Sanitize cursor position to ensure it's valid
 */
function sanitizeCursorPosition(targetElement: HTMLElement, savedCursorPos?: number): number | undefined {
  if (savedCursorPos === undefined) {
    return undefined;
  }

  // Check for obviously invalid values (negative or extremely large)
  if (savedCursorPos < 0 || savedCursorPos > 1000000) {
    console.warn('Invalid cursor position detected:', savedCursorPos);
    return undefined;
  }

  // Get the current content length
  let contentLength = 0;
  if (targetElement instanceof HTMLTextAreaElement || targetElement instanceof HTMLInputElement) {
    contentLength = targetElement.value.length;
  } else if (targetElement.isContentEditable) {
    contentLength = (targetElement.textContent || '').length;
  }

  // Ensure position is within bounds
  const sanitized = Math.max(0, Math.min(savedCursorPos, contentLength));
  
  if (sanitized !== savedCursorPos) {
    console.warn('Cursor position clamped:', { original: savedCursorPos, sanitized, contentLength });
  }

  return sanitized;
}

/**
 * Insert text into textarea element
 */
function insertIntoTextarea(textarea: HTMLTextAreaElement, text: string, cursorPos?: number): void {
  // Use sanitized cursor position or current selection
  const start = cursorPos !== undefined ? cursorPos : (textarea.selectionStart || 0);
  const end = cursorPos !== undefined ? cursorPos : (textarea.selectionEnd || 0);
  const value = textarea.value;
  
  console.log('Textarea insertion:', { start, end, valueLength: value.length });
  
  // Double-check bounds
  const safeStart = Math.max(0, Math.min(start, value.length));
  const safeEnd = Math.max(0, Math.min(end, value.length));
  
  // Insert text at cursor position
  const newValue = value.substring(0, safeStart) + text + value.substring(safeEnd);
  textarea.value = newValue;
  
  // Set cursor position after inserted text
  const newCursorPos = safeStart + text.length;
  try {
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  } catch (error) {
    console.warn('Failed to set cursor position in textarea:', error);
  }
  
  // Dispatch input event to trigger any listeners
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
  
  console.log('Textarea insertion complete:', { newCursorPos, newValueLength: newValue.length });
}

/**
 * Insert text into input element
 */
function insertIntoInput(input: HTMLInputElement, text: string, cursorPos?: number): void {
  const start = cursorPos !== undefined ? cursorPos : (input.selectionStart || 0);
  const end = cursorPos !== undefined ? cursorPos : (input.selectionEnd || 0);
  const value = input.value;
  
  // Double-check bounds
  const safeStart = Math.max(0, Math.min(start, value.length));
  const safeEnd = Math.max(0, Math.min(end, value.length));
  
  const newValue = value.substring(0, safeStart) + text + value.substring(safeEnd);
  input.value = newValue;
  
  const newCursorPos = safeStart + text.length;
  try {
    input.setSelectionRange(newCursorPos, newCursorPos);
  } catch (error) {
    console.warn('Failed to set cursor position in input:', error);
  }
  
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
  
  console.log('Input insertion complete');
}

/**
 * Insert text into contenteditable element with improved error handling and line break preservation
 */
function insertIntoContentEditable(element: HTMLElement, text: string, cursorPos?: number): void {
  console.log('Contenteditable insertion with line break preservation');
  
  // Focus the element first
  element.focus();
  
  // Try to restore cursor position if we have cursorPos
  if (cursorPos !== undefined) {
    const restored = restoreCursorPositionSafely(element, cursorPos);
    if (!restored) {
      console.warn('Failed to restore cursor position, using current selection');
    }
  }
  
  const selection = window.getSelection();
  
  if (selection && selection.rangeCount > 0) {
    try {
      const range = selection.getRangeAt(0);
      
      // Delete any selected content
      range.deleteContents();
      
      // For contenteditable, we need to preserve line breaks by creating proper nodes
      if (text.includes('\n')) {
        // Split text by line breaks and create text nodes with <br> elements
        const lines = text.split('\n');
        const fragment = document.createDocumentFragment();
        
        lines.forEach((line, index) => {
          if (line) {
            fragment.appendChild(document.createTextNode(line));
          }
          
          // Add <br> for line breaks, except after the last line
          if (index < lines.length - 1) {
            fragment.appendChild(document.createElement('br'));
          }
        });
        
        range.insertNode(fragment);
        
        // Move cursor to end of inserted content
        range.setStartAfter(fragment.lastChild || fragment);
        range.setEndAfter(fragment.lastChild || fragment);
      } else {
        // Simple text insertion
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        
        // Move cursor to end of inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
      }
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Dispatch input event
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.focus();
      
      console.log('Contenteditable insertion complete with line break preservation');
      return;
    } catch (error) {
      console.warn('Error during contenteditable insertion:', error);
    }
  }
  
  // Fallback: preserve line breaks when appending to end
  console.log('Contenteditable fallback: appending to end with line break preservation');
  
  if (text.includes('\n')) {
    // Use innerHTML to properly handle line breaks
    const currentHTML = element.innerHTML;
    const lines = text.split('\n');
    const newHTML = lines.join('<br>');
    element.innerHTML = currentHTML + newHTML;
  } else {
    const currentText = element.textContent || '';
    element.textContent = currentText + text;
  }
  
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.focus();
}

/**
 * Safely restore cursor position in contenteditable element
 */
function restoreCursorPositionSafely(element: HTMLElement, targetPos: number): boolean {
  try {
    const textContent = element.textContent || '';
    
    // Ensure target position is within bounds
    const safeTargetPos = Math.max(0, Math.min(targetPos, textContent.length));
    
    if (safeTargetPos !== targetPos) {
      console.warn('Cursor position adjusted for safety:', { original: targetPos, adjusted: safeTargetPos });
    }
    
    const selection = window.getSelection();
    if (!selection) return false;
    
    const range = document.createRange();
    
    // Find the right text node and position
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentPos = 0;
    let targetNode = walker.nextNode();
    
    while (targetNode && currentPos + (targetNode.textContent?.length || 0) < safeTargetPos) {
      currentPos += targetNode.textContent?.length || 0;
      targetNode = walker.nextNode();
    }
    
    if (targetNode) {
      const offsetInNode = safeTargetPos - currentPos;
      const nodeLength = targetNode.textContent?.length || 0;
      const safeOffset = Math.max(0, Math.min(offsetInNode, nodeLength));
      
      if (safeOffset !== offsetInNode) {
        console.warn('Node offset adjusted for safety:', { original: offsetInNode, adjusted: safeOffset, nodeLength });
      }
      
      range.setStart(targetNode, safeOffset);
      range.setEnd(targetNode, safeOffset);
      selection.removeAllRanges();
      selection.addRange(range);
      
      return true;
    } else {
      // If no suitable text node found, position at end
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      
      console.warn('No suitable text node found, positioned at end');
      return true;
    }
  } catch (error) {
    console.error('Error restoring cursor position:', error);
    return false;
  }
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
      const restored = restoreCursorPositionSafely(targetElement, savedCursorPos);
      if (!restored) {
        console.warn('Failed to restore cursor position for Claude');
      }
    }

    // For Claude, try execCommand with line break support first
    try {
      if (document.execCommand && !text.includes('\n')) {
        // execCommand works well for simple text without line breaks
        const success = document.execCommand('insertText', false, text);
        if (success) {
          console.log('Claude insertion successful via execCommand');
          return true;
        }
      }
    } catch (e) {
      console.log('execCommand failed for Claude, trying manual insertion');
    }

    // For text with line breaks or if execCommand fails, use manual insertion
    insertIntoContentEditable(targetElement, text, savedCursorPos);
    console.log('Claude insertion via manual method');
    return true;
  }
  
  // ChatGPT specific handling
  if ((hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) && targetElement instanceof HTMLTextAreaElement) {
    console.log('Attempting ChatGPT-specific insertion');
    
    insertIntoTextarea(targetElement, text, savedCursorPos);
    
    // Important: ChatGPT needs 'change' event too
    targetElement.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('ChatGPT insertion successful');
    return true;
  }
  
  return false;
}

/**
 * Try fallback insertion methods
 */
function tryFallbackInsertion(text: string): void {
  console.warn('Trying fallback insertion methods');
  
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