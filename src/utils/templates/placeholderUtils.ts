// src/utils/templates/placeholderUtils.ts
import {
  isElementVisible,
  restoreCursorPositionSafely
} from './insertionStrategies';
import {
  highlightPlaceholders,
  extractPlaceholders,
  replacePlaceholders
} from './placeholderHelpers';
import { getCursorPosition, setCursorPosition } from './cursorUtils';

export { highlightPlaceholders, extractPlaceholders, replacePlaceholders, getCursorPosition, setCursorPosition, restoreCursorPositionSafely };


export function insertIntoPromptArea(text: string): void {
  const selectors = [
    'textarea[data-id="root"]',
    'div[contenteditable="true"]',
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="Ask Copilot"]',
    'textarea',
    'div[contenteditable]'
  ];

  let target: HTMLElement | null = null;
  for (const sel of selectors) {
    const elements = document.querySelectorAll(sel);
    for (const el of elements) {
      if (el instanceof HTMLElement && isElementVisible(el)) {
        target = el;
        break;
      }
    }
    if (target) break;
  }

  if (!target) return;

  if (target instanceof HTMLTextAreaElement) {
    target.value = text;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.focus();
  } else if (target.isContentEditable) {
    target.textContent = text;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.focus();
  } else if (target instanceof HTMLInputElement) {
    target.value = text;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.focus();
  }
}


export interface ExtractedPlaceholder {
  key: string;
  fullMatch: string;
  position: number;
}

/**
 * Get unique placeholder keys from text
 */
export function getUniquePlaceholderKeys(text: string): string[] {
  const placeholders = extractPlaceholders(text);
  const uniqueKeys = new Set<string>();
  
  placeholders.forEach(placeholder => {
    uniqueKeys.add(placeholder.key);
  });
  
  return Array.from(uniqueKeys);
}

/**
 * Check if text contains any placeholders
 */
export function hasPlaceholders(text: string): boolean {
  if (!text) return false;
  return /\[[^\]]+\]/.test(text);
}

/**
 * Count the number of placeholders in text
 */
export function countPlaceholders(text: string): number {
  return extractPlaceholders(text).length;
}

/**
 * Validate placeholder format
 */
export function isValidPlaceholder(placeholder: string): boolean {
  // Check if it's in the format [something]
  return /^\[[^\]]+\]$/.test(placeholder);
}

/**
 * Insert text at cursor position in a text element
 */
export function insertTextAtCursor(
  element: HTMLElement, 
  text: string, 
  cursorPosition?: number
): void {
  if (element instanceof HTMLTextAreaElement) {
    // Handle textarea
    const textarea = element as HTMLTextAreaElement;
    const start = cursorPosition ?? textarea.selectionStart ?? 0;
    const end = cursorPosition ?? textarea.selectionEnd ?? 0;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    
    textarea.value = before + text + after;
    
    // Set cursor position after inserted text
    const newPosition = start + text.length;
    textarea.setSelectionRange(newPosition, newPosition);
    
    // Trigger input event
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (element.isContentEditable) {
    // Handle contenteditable
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      
      // Move cursor to end of inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger input event
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}