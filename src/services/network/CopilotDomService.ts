import { AbstractBaseService } from '../BaseService';

import { Message } from '@/types';
import { chatService } from './ChatService';
import { detectPlatform } from '@/platforms/platformManager';

export class CopilotDomService extends AbstractBaseService {
  private observer: MutationObserver | null = null;
  private processed = new Set<string>();
  private messageObservers: Map<string, MutationObserver> = new Map();

  protected async onInitialize(): Promise<void> {
    if (detectPlatform() !== 'copilot') {
      return;
    }

    this.scanExistingMessages();
    this.observer = new MutationObserver(this.handleMutations);
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  protected onCleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.messageObservers.forEach(obs => obs.disconnect());
    this.messageObservers.clear();
    this.processed.clear();
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
    if (!el.id) {
      el.id = id;
    }
    if (this.processed.has(id)) return;

    const role = dataContent === 'user-message' ? 'user' : 'assistant';

    if (role === 'assistant') {
      this.waitForAssistantMessage(el, id);
      return;
    }

    const contentEl = el.querySelector('.font-ligatures-none');
    const text = (contentEl ? contentEl.textContent : el.textContent || '')?.trim() || '';
    if (!text) return;

    const message: Message = {
      messageId: id,
      conversationId: chatService.getCurrentConversationId() || '',
      content: text,
      role: 'user',
      model: 'copilot',
      timestamp: Date.now(),
      parent_message_provider_id: null,
    };

    this.processed.add(id);
    document.dispatchEvent(
      new CustomEvent('jaydai:message-extracted', { detail: { message, platform: 'copilot' } })
    );
  }

  private waitForAssistantMessage(el: HTMLElement, id: string): void {
    const sendMessage = () => {
      if (this.processed.has(id)) return;
      if (!el.querySelector('[data-testid="message-item-reactions"]')) return;

      const spans = el.querySelectorAll('p span.font-ligatures-none');
      const text = Array.from(spans)
        .map(s => s.textContent || '')
        .join('\n')
        .trim();
      if (!text) return;

      const message: Message = {
        messageId: id,
        conversationId: chatService.getCurrentConversationId() || '',
        content: text,
        role: 'assistant',
        model: 'copilot',
        timestamp: Date.now(),
        parent_message_provider_id: null,
      };

      this.processed.add(id);
      if (this.messageObservers.has(id)) {
        this.messageObservers.get(id)!.disconnect();
        this.messageObservers.delete(id);
      }
      document.dispatchEvent(
        new CustomEvent('jaydai:message-extracted', { detail: { message, platform: 'copilot' } })
      );
    };

    // Initial check in case the reactions element is already present
    sendMessage();

    if (this.processed.has(id)) return;

    const observer = new MutationObserver(() => sendMessage());
    observer.observe(el, { childList: true, subtree: true });
    this.messageObservers.set(id, observer);
  }
}

export const copilotDomService = new CopilotDomService();
