import { AbstractBaseService } from '../BaseService';
import { getConfigByHostname } from '@/platforms/config';
import { quickSelectorManager } from './QuickSelectorManager';
import { handleSlashCommand } from './handleSlashCommand';

export class SlashCommandService extends AbstractBaseService {
  private static instance: SlashCommandService;
  private inputEl: HTMLElement | null = null;
  private documentListenerAttached = false;
  private observer: MutationObserver | null = null;

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
    quickSelectorManager.close();
    
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
    if (quickSelectorManager.isOpen || quickSelectorManager.isInserting) {
      return;
    }

    const target = e.target as HTMLTextAreaElement | HTMLElement;
    const config = getConfigByHostname(window.location.hostname);
    if (!config) return;

    const promptEl = target.closest(config.domSelectors.PROMPT_TEXTAREA) as HTMLElement | null;
    if (!promptEl) return;

    this.inputEl = promptEl;
    handleSlashCommand(target);
  };
}

export const slashCommandService = SlashCommandService.getInstance();