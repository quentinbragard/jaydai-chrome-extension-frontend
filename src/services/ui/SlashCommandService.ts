import { AbstractBaseService } from '../BaseService';
import { getConfigByHostname } from '@/platforms/config';
import { DIALOG_TYPES } from '@/components/dialogs/DialogRegistry';

export class SlashCommandService extends AbstractBaseService {
  private static instance: SlashCommandService;
  private inputEl: HTMLElement | null = null;
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

  private handleInput = (e: Event) => {
    const target = e.target as HTMLTextAreaElement | HTMLElement;
    let value = '';

    if (target instanceof HTMLTextAreaElement) {
      value = target.value;
    } else if (target instanceof HTMLElement && target.isContentEditable) {
      value = target.innerText;
    }

    if (/\/j\s?$/.test(value)) {
      const newValue = value.replace(/\/j\s?$/, '');

      if (target instanceof HTMLTextAreaElement) {
        target.value = newValue;
        target.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (target instanceof HTMLElement && target.isContentEditable) {
        target.innerText = newValue;
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }

      if (window.dialogManager && typeof window.dialogManager.openDialog === 'function') {
        window.dialogManager.openDialog(DIALOG_TYPES.INSERT_BLOCK);
      }
    }
  };
}

export const slashCommandService = SlashCommandService.getInstance();
