import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AbstractBaseService } from '../BaseService';
import { getConfigByHostname } from '@/platforms/config';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { QuickBlockSelector } from '@/components/prompts/blocks/quick-selector';

export class SlashCommandService extends AbstractBaseService {
  private static instance: SlashCommandService;
  private inputEl: HTMLElement | null = null;
  private observer: MutationObserver | null = null;
  private quickSelectorRoot: Root | null = null;
  private quickSelectorContainer: HTMLDivElement | null = null;

  private constructor() {
    super();
  }

  public static getInstance(): SlashCommandService {
    if (!SlashCommandService.instance) {
      SlashCommandService.instance = new SlashCommandService();
    }
    return SlashCommandService.instance;
  }

  protected async onInitialize(): Promise<void> {
    this.attachListener();
    this.observeDom();
  }

  protected onCleanup(): void {
    this.detachListener();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.closeQuickSelector();
  }

  private observeDom() {
    this.observer = new MutationObserver(() => this.attachListener());
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  private attachListener() {
    const config = getConfigByHostname(window.location.hostname);
    if (!config) return;

    const el = document.querySelector(config.domSelectors.PROMPT_TEXTAREA) as HTMLElement | null;
    if (!el || el === this.inputEl) return;

    this.detachListener();
    this.inputEl = el;
    this.inputEl.addEventListener('input', this.handleInput);
  }

  private detachListener() {
    if (this.inputEl) {
      this.inputEl.removeEventListener('input', this.handleInput);
      this.inputEl = null;
    }
  }

  /**
   * Enhanced cursor position calculation that works accurately for different element types
   */
  private getCursorPosition(element: HTMLElement): { x: number; y: number } {
    // For textarea elements
    if (element instanceof HTMLTextAreaElement) {
      const selectionStart = element.selectionStart || 0;
      
      // Create a mirror div to calculate exact position
      const mirrorDiv = this.createTextareaMirror(element);
      const textBeforeCursor = element.value.substring(0, selectionStart);
      
      // Add text before cursor to mirror
      mirrorDiv.textContent = textBeforeCursor;
      
      // Add a span to mark cursor position
      const cursorSpan = document.createElement('span');
      cursorSpan.textContent = '|';
      mirrorDiv.appendChild(cursorSpan);
      
      document.body.appendChild(mirrorDiv);
      
      // Get the position of the cursor span
      const spanRect = cursorSpan.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // Calculate actual cursor position accounting for scroll
      const x = spanRect.left;
      const y = spanRect.top - element.scrollTop;
      
      document.body.removeChild(mirrorDiv);
      
      return { x, y };
    }
    
    // For contenteditable elements
    if (element.isContentEditable) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Create a temporary span at cursor position
        const tempSpan = document.createElement('span');
        tempSpan.style.position = 'absolute';
        tempSpan.textContent = '|';
        
        try {
          range.insertNode(tempSpan);
          const rect = tempSpan.getBoundingClientRect();
          const x = rect.left;
          const y = rect.top;
          
          // Remove the temporary span
          tempSpan.remove();
          
          return { x, y };
        } catch (error) {
          // Fallback if insertion fails
          tempSpan.remove();
          const rect = element.getBoundingClientRect();
          return { x: rect.left, y: rect.top };
        }
      }
    }
    
    // For input elements
    if (element instanceof HTMLInputElement) {
      const selectionStart = element.selectionStart || 0;
      
      // Create a temporary element to measure text width
      const tempElement = document.createElement('span');
      const computedStyle = window.getComputedStyle(element);
      
      // Copy relevant styles
      tempElement.style.font = computedStyle.font;
      tempElement.style.fontSize = computedStyle.fontSize;
      tempElement.style.fontFamily = computedStyle.fontFamily;
      tempElement.style.fontWeight = computedStyle.fontWeight;
      tempElement.style.letterSpacing = computedStyle.letterSpacing;
      tempElement.style.position = 'absolute';
      tempElement.style.visibility = 'hidden';
      tempElement.style.whiteSpace = 'pre';
      
      // Get text before cursor
      const textBeforeCursor = element.value.substring(0, selectionStart);
      tempElement.textContent = textBeforeCursor;
      
      document.body.appendChild(tempElement);
      
      // Calculate position
      const rect = element.getBoundingClientRect();
      const textWidth = tempElement.offsetWidth;
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      
      const x = rect.left + paddingLeft + textWidth;
      const y = rect.top;
      
      document.body.removeChild(tempElement);
      
      return { x, y };
    }
    
    // Fallback to element position
    const rect = element.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }

  /**
   * Create a mirror div that exactly matches the textarea's styling and dimensions
   */
  private createTextareaMirror(textarea: HTMLTextAreaElement): HTMLDivElement {
    const mirrorDiv = document.createElement('div');
    const computedStyle = window.getComputedStyle(textarea);
    
    // Copy all relevant styles
    const stylesToCopy = [
      'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
      'textTransform', 'wordSpacing', 'textIndent', 'textAlign',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle',
      'whiteSpace', 'wordWrap', 'overflowWrap'
    ];
    
    stylesToCopy.forEach(prop => {
      (mirrorDiv.style as any)[prop] = computedStyle.getPropertyValue(prop);
    });
    
    // Set position and dimensions
    mirrorDiv.style.position = 'absolute';
    mirrorDiv.style.top = '0';
    mirrorDiv.style.left = '0';
    mirrorDiv.style.visibility = 'hidden';
    mirrorDiv.style.height = 'auto';
    mirrorDiv.style.width = textarea.offsetWidth + 'px';
    mirrorDiv.style.minHeight = textarea.offsetHeight + 'px';
    mirrorDiv.style.overflow = 'hidden';
    
    return mirrorDiv;
  }

  private showQuickSelector(position: { x: number; y: number }, targetElement: HTMLElement, cursorPosition?: number) {
    this.closeQuickSelector();

    // Create container
    this.quickSelectorContainer = document.createElement('div');
    this.quickSelectorContainer.id = 'jaydai-quick-selector';
    document.body.appendChild(this.quickSelectorContainer);

    // Create React root and render
    this.quickSelectorRoot = createRoot(this.quickSelectorContainer);
    
    this.quickSelectorRoot.render(
      React.createElement(QuickBlockSelector, {
        position: position,
        onClose: () => this.closeQuickSelector(),
        targetElement: targetElement,
        cursorPosition: cursorPosition,
        onOpenFullDialog: () => {
          // Open the full dialog using the global dialog manager
          if (window.dialogManager && typeof window.dialogManager.openDialog === 'function') {
            window.dialogManager.openDialog(DIALOG_TYPES.INSERT_BLOCK);
          }
        }
      })
    );
  }

  private closeQuickSelector() {
    if (this.quickSelectorRoot) {
      this.quickSelectorRoot.unmount();
      this.quickSelectorRoot = null;
    }
    
    if (this.quickSelectorContainer) {
      this.quickSelectorContainer.remove();
      this.quickSelectorContainer = null;
    }
  }

  private handleInput = (e: Event) => {
    const target = e.target as HTMLTextAreaElement | HTMLElement;
    let value = '';
    let originalCursorPos = 0;

    if (target instanceof HTMLTextAreaElement) {
      value = target.value;
      originalCursorPos = target.selectionStart || 0;
    } else if (target instanceof HTMLElement && target.isContentEditable) {
      value = target.innerText;
      // For contenteditable, we'll handle cursor position differently
    }

    // Check for //j pattern (with optional space)
    if (/\/\/j\s?$/i.test(value)) {
      // Calculate the cursor position after removing the trigger
      const triggerMatch = value.match(/\/\/j\s?$/i);
      const triggerLength = triggerMatch ? triggerMatch[0].length : 0;
      const newCursorPos = originalCursorPos - triggerLength;
      
      // Remove the //j trigger from the input
      const newValue = value.replace(/\/\/j\s?$/i, '');

      if (target instanceof HTMLTextAreaElement) {        
        target.value = newValue;
        target.setSelectionRange(newCursorPos, newCursorPos);
        target.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (target instanceof HTMLElement && target.isContentEditable) {
        target.innerText = newValue;
        
        // Set cursor to the correct position in contenteditable
        const selection = window.getSelection();
        const range = document.createRange();
        
        // Try to set cursor at the calculated position
        const textNode = target.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          const maxPos = Math.min(newCursorPos, textNode.textContent?.length || 0);
          range.setStart(textNode, maxPos);
          range.setEnd(textNode, maxPos);
        } else {
          range.setStart(target, 0);
          range.setEnd(target, 0);
        }
        
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Get cursor position AFTER updating the text and show selector
      setTimeout(() => {
        const position = this.getCursorPosition(target);
        this.showQuickSelector(position, target, newCursorPos);
      }, 0);
    }
  };
}

export const slashCommandService = SlashCommandService.getInstance();