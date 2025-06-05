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

  private getCursorPosition(element: HTMLElement): { x: number; y: number } {
    // For textarea elements
    if (element instanceof HTMLTextAreaElement) {
      // Create a temporary div to measure cursor position
      const temp = document.createElement('div');
      const computedStyle = window.getComputedStyle(element);
      
      // Copy styles for accurate measurement
      temp.style.cssText = computedStyle.cssText;
      temp.style.position = 'absolute';
      temp.style.visibility = 'hidden';
      temp.style.height = 'auto';
      temp.style.width = element.offsetWidth + 'px';
      temp.style.whiteSpace = 'pre-wrap';
      temp.style.wordWrap = 'break-word';
      
      // Get text up to cursor
      const selectionStart = element.selectionStart || 0;
      const textBeforeCursor = element.value.substring(0, selectionStart);
      temp.textContent = textBeforeCursor;
      
      document.body.appendChild(temp);
      
      // Calculate position
      const rect = element.getBoundingClientRect();
      const x = rect.left + temp.offsetWidth % element.offsetWidth;
      const y = rect.top + temp.offsetHeight - element.scrollTop;
      
      document.body.removeChild(temp);
      
      return { x, y };
    }
    
    // For contenteditable elements
    if (element.isContentEditable) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
      }
    }
    
    // Fallback to element position
    const rect = element.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }

  private showQuickSelector(position: { x: number; y: number }, targetElement: HTMLElement) {
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

    if (target instanceof HTMLTextAreaElement) {
      value = target.value;
    } else if (target instanceof HTMLElement && target.isContentEditable) {
      value = target.innerText;
    }

    // Check for //j pattern (with optional space)
    if (/\/\/j\s?$/i.test(value)) {
      // Remove the //j trigger from the input
      const newValue = value.replace(/\/\/j\s?$/i, '');

      if (target instanceof HTMLTextAreaElement) {
        target.value = newValue;
        target.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (target instanceof HTMLElement && target.isContentEditable) {
        target.innerText = newValue;
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Get cursor position and show quick selector
      const position = this.getCursorPosition(target);
      this.showQuickSelector(position, target);
    }
  };
}

export const slashCommandService = SlashCommandService.getInstance();