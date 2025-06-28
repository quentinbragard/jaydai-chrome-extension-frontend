import { AbstractBaseService } from '../BaseService';
import { debug } from '@/core/config';
import { Message } from '@/types';
import { chatService } from './ChatService';
import { detectPlatform } from '@/platforms/platformManager';

export class CopilotDomService extends AbstractBaseService {
  private observer: MutationObserver | null = null;
  private processed = new Set<string>();

  protected async onInitialize(): Promise<void> {
    if (detectPlatform() !== 'copilot') {
      debug('CopilotDomService: not on Copilot site');
      return;
    }

    debug('Initializing CopilotDomService');
    this.scanExistingMessages();
    this.observer = new MutationObserver(this.handleMutations);
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  protected onCleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.processed.clear();
    debug('CopilotDomService cleaned up');
  }

  private handleMutations = (mutations: MutationRecord[]): void => {
    for (const m of mutations) {
      m.addedNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          this.processMessageNode(node);
          node
            .querySelectorAll('[data-content="user-message"], [data-content="ai-message"]')
            .forEach(el => this.processMessageNode(el as HTMLElement));
        }
      });
    }
  };

  private scanExistingMessages(): void {
    document
      .querySelectorAll('[data-content="user-message"], [data-content="ai-message"]')
      .forEach(el => this.processMessageNode(el as HTMLElement));
  }

  private processMessageNode(el: HTMLElement): void {
    const dataContent = el.getAttribute('data-content');
    if (!dataContent) return;
    const id = el.id || `msg-${Date.now()}-${Math.random()}`;
    if (this.processed.has(id)) return;
    this.processed.add(id);

    const role = dataContent === 'user-message' ? 'user' : 'assistant';
    let text = '';
    if (role === 'user') {
      const contentEl = el.querySelector('.font-ligatures-none');
      text = contentEl ? contentEl.textContent || '' : el.textContent || '';
    } else {
      text = el.textContent || '';
    }
    text = text.trim();

    if (!text) return;

    const message: Message = {
      messageId: id,
      conversationId: chatService.getCurrentConversationId() || '',
      content: text,
      role: role as 'user' | 'assistant',
      model: 'copilot',
      timestamp: Date.now(),
      parent_message_provider_id: null,
    };

    document.dispatchEvent(
      new CustomEvent('jaydai:message-extracted', { detail: { message, platform: 'copilot' } })
    );
  }
}

export const copilotDomService = new CopilotDomService();
