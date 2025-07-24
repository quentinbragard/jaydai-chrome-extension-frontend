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
          // Check if the node itself is a message
          this.processMessageNode(node);
          
          // Only search within the node if it's not already a message node
          // This prevents double processing
          if (!this.isMessageNode(node)) {
            node
              .querySelectorAll('[data-tabster]')
              .forEach(el => this.processMessageNode(el as HTMLElement));
          }
        }
      });
    }
  };

  private scanExistingMessages(): void {
    document
      .querySelectorAll('[data-tabster]')
      .forEach(el => this.processMessageNode(el as HTMLElement));
  }

  private isMessageNode(el: HTMLElement): boolean {
    const ariaLabelledBy = el.getAttribute('aria-labelledby');
    if (!ariaLabelledBy) return false;
    
    return ariaLabelledBy.includes('-user-message') || ariaLabelledBy.includes('-author');
  }

  private processMessageNode(el: HTMLElement): void {
    const ariaLabelledBy = el.getAttribute('aria-labelledby');
    if (!ariaLabelledBy) return;

    // Determine message type and extract message ID
    let role: 'user' | 'assistant' | null = null;
    let messageId: string | null = null;

    if (ariaLabelledBy.includes('-user-message')) {
      role = 'user';
      messageId = ariaLabelledBy.split('-user-message')[0];
    } else if (ariaLabelledBy.includes('-author')) {
      role = 'assistant';
      messageId = ariaLabelledBy.split('-author')[0];
    }

    if (!role || !messageId) return;


    // Prevent duplicate processing
    if (this.processed.has(messageId)) {
      return;
    }

    if (role === 'assistant') {
      this.waitForAssistantMessage(el, messageId);
      return;
    }

    // Process user message immediately
    this.processUserMessage(el, messageId);
  }

  private processUserMessage(el: HTMLElement, id: string): void {
    if (this.processed.has(id)) return;

    const contentEl = el.querySelector('.font-ligatures-none');
    const text = (contentEl ? contentEl.textContent : el.textContent || '')?.trim() || '';
    if (!text) {
      return;
    }

    const message: Message = {
      messageId: id,
      conversationId: chatService.getCurrentConversationId() || '',
      content: text,
      role: 'user',
      model: 'copilot',
      timestamp: Date.now(),
      parent_message_provider_id: null,
    };

    // Mark as processed immediately to prevent duplicates
    this.processed.add(id);
    
    
    document.dispatchEvent(
      new CustomEvent('jaydai:message-extracted', { detail: { message, platform: 'copilot' } })
    );
  }

  private waitForAssistantMessage(el: HTMLElement, id: string): void {
    if (this.processed.has(id)) return;

    const processAssistantMessage = () => {
      // Skip if already processed
      if (this.processed.has(id)) return;

      // CRITICAL: Check that streaming has ended
      // 1. Stop button should NOT be present (streaming ended)
      const stopButton = document.querySelector('button[data-testid="stop-button"]');
      if (stopButton) {
        return;
      }



      // Extract content from the assistant message
      const spans = el.querySelectorAll('p span.font-ligatures-none');
      const text = Array.from(spans)
        .map(s => s.textContent || '')
        .join('\n')
        .trim();
      
      if (!text) {
        return;
      }

      const message: Message = {
        messageId: id,
        conversationId: chatService.getCurrentConversationId() || '',
        content: text,
        role: 'assistant',
        model: 'copilot',
        timestamp: Date.now(),
        parent_message_provider_id: null,
      };

      // Mark as processed immediately to prevent duplicates
      this.processed.add(id);
      
      // Clean up the observer for this message
      const observer = this.messageObservers.get(id);
      if (observer) {
        observer.disconnect();
        this.messageObservers.delete(id);
      }

        id, 
        contentLength: text.length,
        hasStopButton: !!stopButton
      });

      document.dispatchEvent(
        new CustomEvent('jaydai:message-extracted', { detail: { message, platform: 'copilot' } })
      );
    };

    // Try processing immediately in case it's already complete
    processAssistantMessage();

    // If not processed yet, set up observer to wait for completion
    if (!this.processed.has(id)) {
      const observer = new MutationObserver(() => {
        processAssistantMessage();
      });

      observer.observe(el, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['data-testid']
      });
      
      this.messageObservers.set(id, observer);
    }
  }
}

export const copilotDomService = new CopilotDomService();