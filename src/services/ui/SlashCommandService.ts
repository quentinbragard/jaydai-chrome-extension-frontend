import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AbstractBaseService } from '../BaseService';
import { getConfigByHostname } from '@/platforms/config';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';
import { QuickBlockSelector } from '@/components/prompts/blocks/quick-selector';

export class SlashCommandService extends AbstractBaseService {
  private static instance: SlashCommandService;
  private inputEl: HTMLElement | null = null;
  private documentListenerAttached = false;
  private observer: MutationObserver | null = null;
  private quickSelectorRoot: Root | null = null;
  private quickSelectorContainer: HTMLDivElement | null = null;
  private isQuickSelectorOpen = false;
  private isInserting = false; // Prevent double insertion

  private constructor() {
    super();
  }

  public static getInstance(): SlashCommandService {
    if (!SlashCommandService.instance) {
      SlashCommandService.instance = new SlashCommandService();
    }
    return SlashCommandService.instance;
  }

  /**
   * Safely remove trigger text from contenteditable element
   */
  private removeTrigerFromContentEditable(element: HTMLElement, triggerLength: number): void {
    const selection = window.getSelection();
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      try {
        // Create a range to select the trigger text
        const triggerRange = document.createRange();
        
        // Get the current text node and position
        const currentNode = range.startContainer;
        const currentOffset = range.startOffset;
        
        if (currentNode.nodeType === Node.TEXT_NODE) {
          const startOffset = Math.max(0, currentOffset - triggerLength);
          triggerRange.setStart(currentNode, startOffset);
          triggerRange.setEnd(currentNode, currentOffset);
          
          // Delete the trigger text
          triggerRange.deleteContents();
          
          // Update selection to the new position
          const newRange = document.createRange();
          newRange.setStart(currentNode, startOffset);
          newRange.setEnd(currentNode, startOffset);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } else {
          // Fallback: use the whole element approach
          const textContent = element.textContent || '';
          const newText = textContent.replace(/\/\/j\s?$/i, '');
          element.textContent = newText;
        }
        
        element.dispatchEvent(new Event('input', { bubbles: true }));
        
      } catch (error) {
        console.warn('Error removing trigger from contenteditable:', error);
        // Ultimate fallback
        const textContent = element.textContent || '';
        const newText = textContent.replace(/\/\/j\s?$/i, '');
        element.textContent = newText;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      // No selection, fallback to text replacement
      const textContent = element.textContent || '';
      const newText = textContent.replace(/\/\/j\s?$/i, '');
      element.textContent = newText;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /**
   * Publicly accessible method to refresh the listener
   * Useful after DOM changes or insertions
   */
  public refreshListener(): void {
    console.log('Manually refreshing slash command listener...');
    this.attachListener();
  }

  /**
   * Enhanced initialization with retry mechanism
   */
  protected async onInitialize(): Promise<void> {
    this.attachListener();
    this.observeDom();
    
    // Make the service accessible globally for manual refresh
    (window as any).slashCommandService = this;
    
    // Set up a periodic check to ensure we stay attached
    setInterval(() => {
      this.attachListener();
    }, 2000); // Check every 2 seconds
  }

  protected onCleanup(): void {
    this.detachListener();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.closeQuickSelector();
    
    // Clean up global reference
    if ((window as any).slashCommandService === this) {
      delete (window as any).slashCommandService;
    }
  }

  private observeDom() {
    this.observer = new MutationObserver(() => {
      // Reattach listener more aggressively after DOM changes
      setTimeout(() => this.attachListener(), 100);
    });
    this.observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      characterData: true,
      attributes: true 
    });
  }

  private attachListener() {
    const config = getConfigByHostname(window.location.hostname);
    if (!config) return;

    if (!this.documentListenerAttached) {
      document.addEventListener('input', this.handleInput, true);
      this.documentListenerAttached = true;
    }

    const el = document.querySelector(config.domSelectors.PROMPT_TEXTAREA) as HTMLElement | null;
    if (el) this.inputEl = el;
  }

  private detachListener() {
    if (this.documentListenerAttached) {
      document.removeEventListener('input', this.handleInput, true);
      this.documentListenerAttached = false;
    }
    this.inputEl = null;
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
    this.isQuickSelectorOpen = true;
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
    
    this.isQuickSelectorOpen = false;
    
    // Reset insertion flag as safety measure
    setTimeout(() => {
      this.isInserting = false;
    }, 100);
  }

  /**
   * Get current cursor position in text content (not screen coordinates)
   */
  private getCurrentCursorPosition(element: HTMLElement): number {
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      return element.selectionStart || 0;
    }
    
    if (element.isContentEditable) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Calculate character position from start of element
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let position = 0;
        let currentNode = walker.nextNode();
        
        while (currentNode && currentNode !== range.startContainer) {
          position += currentNode.textContent?.length || 0;
          currentNode = walker.nextNode();
        }
        
        if (currentNode === range.startContainer) {
          position += range.startOffset;
        }
        
        return position;
      }
    }
    
    return 0;
  }

  private handleInput = (e: Event) => {
    // Skip if selector is already open or we're currently inserting
    if (this.isQuickSelectorOpen || this.isInserting) {
      return;
    }

    const target = e.target as HTMLTextAreaElement | HTMLElement;
    const config = getConfigByHostname(window.location.hostname);
    if (!config) return;

    const promptEl = target.closest(config.domSelectors.PROMPT_TEXTAREA) as HTMLElement | null;
    if (!promptEl) return;

    this.inputEl = promptEl;
    let value = '';
    let originalCursorPos = 0;

    // Get current values
    if (target instanceof HTMLTextAreaElement) {
      value = target.value;
      originalCursorPos = target.selectionStart || 0;
    } else if (target instanceof HTMLElement && target.isContentEditable) {
      // For contenteditable, preserve line breaks properly
      value = target.innerText || target.textContent || '';
      originalCursorPos = this.getCurrentCursorPosition(target);
    }

    // Check for //j pattern (with optional space)
    const triggerRegex = /\/\/j\s?$/i;
    if (triggerRegex.test(value)) {
      console.log('Slash command detected:', { value: value.substring(Math.max(0, value.length - 20)), originalCursorPos });
      
      // Set flag to prevent double execution
      this.isInserting = true;
      
      // Calculate the cursor position after removing the trigger
      const triggerMatch = value.match(triggerRegex);
      const triggerLength = triggerMatch ? triggerMatch[0].length : 0;
      
      // Ensure cursor position never goes negative
      const newCursorPos = Math.max(0, originalCursorPos - triggerLength);
      
      console.log('Cursor calculation:', { 
        originalCursorPos, 
        triggerLength, 
        newCursorPos,
        valueLength: value.length 
      });

      // Remove the //j trigger from the input
      const newValue = value.replace(triggerRegex, '');

      if (target instanceof HTMLTextAreaElement) {        
        target.value = newValue;
        // Ensure cursor position is within bounds
        const safeCursorPos = Math.min(newCursorPos, newValue.length);
        target.setSelectionRange(safeCursorPos, safeCursorPos);
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true })); // Important for some platforms
      } else if (target instanceof HTMLElement && target.isContentEditable) {
        // For contenteditable, be more careful about text replacement
        this.removeTrigerFromContentEditable(target, triggerLength);
      }

      // Get cursor position AFTER updating the text and show selector
      setTimeout(() => {
        try {
          // Ensure we're still focused on the right element
          target.focus();
          
          const position = this.getCursorPosition(target);
          // Use the safe cursor position we calculated
          const safeCursorPos = target instanceof HTMLTextAreaElement 
            ? Math.min(newCursorPos, target.value.length)
            : Math.min(newCursorPos, (target.textContent || '').length);
            
          console.log('Showing quick selector at position:', { position, safeCursorPos });
          this.showQuickSelector(position, target, safeCursorPos);
        } catch (error) {
          console.error('Error showing quick selector:', error);
        } finally {
          // Reset the flag after a delay
          setTimeout(() => {
            this.isInserting = false;
          }, 100);
        }
      }, 50); // Reduced timeout for better responsiveness
    }
  };
}

export const slashCommandService = SlashCommandService.getInstance();