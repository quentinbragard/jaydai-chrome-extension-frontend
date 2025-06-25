import { AbstractBaseService } from '../BaseService';
import { getConfigByHostname } from '@/platforms/config';
import { QuickSelectorManager } from './QuickSelectorManager';
import {
  removeTriggerFromContentEditable,
  getCursorCoordinates,
  getCursorTextPosition
} from './slashUtils';

export class SlashCommandService extends AbstractBaseService {
  private static instance: SlashCommandService;
  private inputEl: HTMLElement | null = null;
  private documentListenerAttached = false;
  private observer: MutationObserver | null = null;
  private quickSelector = new QuickSelectorManager();
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
    this.quickSelector.close();
    setTimeout(() => {
      this.isInserting = false;
    }, 100);
    
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
   * Get current cursor position in text content (not screen coordinates)
   */

  private handleInput = (e: Event) => {
    // Skip if selector is already open or we're currently inserting
    if (this.quickSelector.isOpen || this.isInserting) {
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
      originalCursorPos = getCursorTextPosition(target);
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

      // Show selector without altering the input. The trigger will be removed
      // only if the user selects a block.
      // Get cursor position and show selector
      setTimeout(() => {
        try {
          // Ensure we're still focused on the right element
          target.focus();

          const position = getCursorCoordinates(target);
          // Use the safe cursor position we calculated
          const safeCursorPos = target instanceof HTMLTextAreaElement
            ? Math.min(newCursorPos, target.value.length)
            : Math.min(newCursorPos, (target.textContent || '').length);

          console.log('Showing quick selector at position:', { position, safeCursorPos });
          this.quickSelector.open(position, target, safeCursorPos, triggerLength);
        } catch (error) {
          console.error('Error showing quick selector:', error);
        } finally {
          // Reset the flag after a delay
          setTimeout(() => {
            this.isInserting = false;
          }, 100);
        }
      }, 0); // Trigger immediately after the input event
    }
  };
}

export const slashCommandService = SlashCommandService.getInstance();
