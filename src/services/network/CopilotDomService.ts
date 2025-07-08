import { AbstractBaseService } from '../BaseService';
import { Message } from '@/types';
import { chatService } from './ChatService';
import { detectPlatform } from '@/platforms/platformManager';

export class CopilotDomService extends AbstractBaseService {
  private observer: MutationObserver | null = null;
  private processed = new Set<string>();
  private messageObservers: Map<string, MutationObserver> = new Map();
  private processingTimeouts: Map<string, number> = new Map();
  private readonly DEBOUNCE_DELAY = 200; // Reduced delay
  private readonly MAX_PROCESSING_ATTEMPTS = 15; // Increased attempts
  private processingAttempts: Map<string, number> = new Map();

  protected async onInitialize(): Promise<void> {
    if (detectPlatform() !== 'copilot') {
      return;
    }
    console.log('🔍 CopilotDomService initialized');

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
    
    this.processingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.processingTimeouts.clear();
    
    this.processed.clear();
    this.processingAttempts.clear();
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

    const handleWithId = (msgId: string) => {
      if (this.processed.has(msgId)) return;

      const role = dataContent === 'user-message' ? 'user' : 'assistant';

      if (role === 'assistant') {
        this.waitForAssistantMessage(el, msgId);
        return;
      }

      this.processUserMessage(el, msgId);
    };

    const id = el.id;
    if (id) {
      handleWithId(id);
    } else {
      const attrObserver = new MutationObserver(mutations => {
        for (const m of mutations) {
          if (m.type === 'attributes' && m.attributeName === 'id' && el.id) {
            attrObserver.disconnect();
            handleWithId(el.id);
            break;
          }
        }
      });
      attrObserver.observe(el, { attributes: true });
    }
  }

  private processUserMessage(el: HTMLElement, id: string): void {
    if (this.processed.has(id)) return;

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
    console.log('📤 Copilot user message processed:', { id, contentLength: text.length });
    
    document.dispatchEvent(
      new CustomEvent('jaydai:message-extracted', { detail: { message, platform: 'copilot' } })
    );
  }

  private waitForAssistantMessage(el: HTMLElement, id: string): void {
    if (this.processed.has(id)) return;

    console.log('🤖 Starting to wait for assistant message:', id);

    if (!this.processingAttempts.has(id)) {
      this.processingAttempts.set(id, 0);
    }

    const attemptProcessing = () => {
      if (this.processed.has(id)) return;

      const attempts = this.processingAttempts.get(id) || 0;
      console.log(`🔄 Processing attempt ${attempts + 1} for message ${id}`);

      if (attempts >= this.MAX_PROCESSING_ATTEMPTS) {
        console.warn(`⚠️ Max processing attempts reached for message ${id}, forcing processing`);
        this.forceProcessAssistantMessage(el, id);
        return;
      }

      this.processingAttempts.set(id, attempts + 1);

      // Check if message is still streaming
      if (this.isMessageStreaming(el)) {
        console.log(`⏳ Message ${id} still streaming (attempt ${attempts + 1})`);
        this.scheduleProcessing(id, attemptProcessing);
        return;
      }

      // Try to process the message
      if (this.tryProcessAssistantMessage(el, id)) {
        console.log(`✅ Successfully processed message ${id} on attempt ${attempts + 1}`);
        return;
      }

      // Not ready yet, try again
      console.log(`⏳ Message ${id} not ready yet (attempt ${attempts + 1})`);
      this.scheduleProcessing(id, attemptProcessing);
    };

    // Set up mutation observer
    const observer = new MutationObserver(() => {
      this.scheduleProcessing(id, attemptProcessing);
    });

    observer.observe(el, { 
      childList: true, 
      subtree: true, 
      attributes: true
    });
    
    this.messageObservers.set(id, observer);

    // Initial attempt
    attemptProcessing();
  }

  private isMessageStreaming(el: HTMLElement): boolean {
    // Primary indicator: stop button
    const stopButton = el.querySelector('[data-testid="stop-button"]');
    if (stopButton) {
      console.log('🛑 Stop button found - message is streaming');
      return true;
    }

    // Secondary indicators: loading animations
    const loadingElements = el.querySelectorAll('.animate-pulse, .animate-spin, [aria-busy="true"]');
    if (loadingElements.length > 0) {
      console.log('⏳ Loading animation found - message might be streaming');
      return true;
    }

    return false;
  }

  private tryProcessAssistantMessage(el: HTMLElement, id: string): boolean {
    // Get content using multiple selectors
    const content = this.extractMessageContent(el);
    
    if (!content || content.length < 1) {
      console.log(`❌ No content found for message ${id}`);
      return false;
    }

    // Check for completion indicators (but don't require them)
    const hasReactions = !!el.querySelector('[data-testid="message-item-reactions"]');
    const hasStopButton = !!el.querySelector('[data-testid="stop-button"]');
    
    console.log(`📊 Message ${id} status:`, {
      contentLength: content.length,
      hasReactions,
      hasStopButton,
      streaming: this.isMessageStreaming(el)
    });

    // If we have content and no stop button, it's likely complete
    if (content.length > 0 && !hasStopButton) {
      this.processCompleteAssistantMessage(el, id, content);
      return true;
    }

    return false;
  }

  private extractMessageContent(el: HTMLElement): string {
    // Try multiple content extraction methods
    const contentSelectors = [
      'p span.font-ligatures-none',
      '.font-ligatures-none',
      'p span',
      'p',
      '[data-testid="message-content"]'
    ];

    for (const selector of contentSelectors) {
      const elements = el.querySelectorAll(selector);
      if (elements.length > 0) {
        const text = Array.from(elements)
          .map(el => el.textContent || '')
          .filter(text => text.trim().length > 0)
          .join('\n')
          .trim();
        
        if (text.length > 0) {
          console.log(`📝 Content found using selector "${selector}":`, text.substring(0, 100));
          return text;
        }
      }
    }

    // Fallback: get all text content
    const fallbackText = el.textContent?.trim() || '';
    if (fallbackText.length > 0) {
      console.log('📝 Content found using fallback method:', fallbackText.substring(0, 100));
    }
    
    return fallbackText;
  }

  private forceProcessAssistantMessage(el: HTMLElement, id: string): void {
    const content = this.extractMessageContent(el);
    if (content && content.length > 0) {
      console.log(`🚀 Force processing message ${id} with content length:`, content.length);
      this.processCompleteAssistantMessage(el, id, content);
    } else {
      console.warn(`⚠️ No content found for forced processing of message ${id}`);
      this.cleanupMessage(id);
    }
  }

  private scheduleProcessing(id: string, callback: () => void): void {
    const existingTimeout = this.processingTimeouts.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      this.processingTimeouts.delete(id);
      callback();
    }, this.DEBOUNCE_DELAY);

    this.processingTimeouts.set(id, timeout);
  }

  private processCompleteAssistantMessage(el: HTMLElement, id: string, content: string): void {
    if (this.processed.has(id)) return;

    const message: Message = {
      messageId: id,
      conversationId: chatService.getCurrentConversationId() || '',
      content: content,
      role: 'assistant',
      model: 'copilot',
      timestamp: Date.now(),
      parent_message_provider_id: null,
    };

    this.processed.add(id);
    this.cleanupMessage(id);

    console.log('✅ Copilot assistant message processed:', { 
      id, 
      contentLength: content.length,
      conversationId: message.conversationId 
    });

    document.dispatchEvent(
      new CustomEvent('jaydai:message-extracted', { detail: { message, platform: 'copilot' } })
    );
  }

  private cleanupMessage(id: string): void {
    const observer = this.messageObservers.get(id);
    if (observer) {
      observer.disconnect();
      this.messageObservers.delete(id);
    }

    const timeout = this.processingTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.processingTimeouts.delete(id);
    }

    this.processingAttempts.delete(id);
    console.log('🧹 Cleaned up resources for message:', id);
  }
}

export const copilotDomService = new CopilotDomService();