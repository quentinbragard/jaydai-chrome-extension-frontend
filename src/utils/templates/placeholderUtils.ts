// src/utils/templates/placeholderUtils.ts
import {
  sanitizeCursorPosition,
  insertIntoTextarea,
  insertIntoInput,
  insertIntoContentEditable,
  tryPlatformSpecificInsertion,
  tryFallbackInsertion,
  isElementVisible,
  restoreCursorPositionSafely
} from './insertionStrategies';
import {
  highlightPlaceholders,
  extractPlaceholders,
  replacePlaceholders
} from './placeholderHelpers';
import { getCursorPosition } from '@/utils/pompts/templates/getCursorPosition';
import { setCursorPosition } from '@/utils/pompts/templates/setCursorPosition';

export { highlightPlaceholders, extractPlaceholders, replacePlaceholders, getCursorPosition, setCursorPosition, restoreCursorPositionSafely };

export function insertTextAtCursor(targetElement: HTMLElement, text: string, savedCursorPos?: number): void {
  if (!targetElement || !text) return;
  if ((window as any)._jaydaiInserting) return;
  (window as any)._jaydaiInserting = true;

  try {
    const sanitized = sanitizeCursorPosition(targetElement, savedCursorPos);
    const success = tryPlatformSpecificInsertion(targetElement, text, sanitized);
    if (success) return;

    if (targetElement instanceof HTMLTextAreaElement) {
      insertIntoTextarea(targetElement, text, sanitized);
      return;
    }
    if (targetElement.isContentEditable) {
      insertIntoContentEditable(targetElement, text, sanitized);
      return;
    }
    if (targetElement instanceof HTMLInputElement) {
      insertIntoInput(targetElement, text, sanitized);
      return;
    }
    tryFallbackInsertion(text);
  } finally {
    setTimeout(() => {
      (window as any)._jaydaiInserting = false;
    }, 50);
  }
}

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
