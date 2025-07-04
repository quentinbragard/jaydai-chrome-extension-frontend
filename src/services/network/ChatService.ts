// src/services/network/ChatService.ts
import { AbstractBaseService } from '../BaseService';

import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { emitEvent, AppEvent } from '@/core/events/events';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import {
  handleConversationList,
  handleSpecificConversation,
  handleChatCompletion,
  handleAssistantResponse,
  detectPlatform
} from '@/platforms/platformManager';
import { getConfigByName, getConfigByHostname } from '@/platforms/config';

export class ChatService extends AbstractBaseService {
  private static instance: ChatService;
  private currentConversationId: string | null = null;
  private currentPlatform: string | null = null;
  private urlObserver: MutationObserver | null = null;

  private constructor() {
    super();
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  protected async onInitialize(): Promise<void> {
    
    // Detect current platform
    this.currentPlatform = detectPlatform();
    
    // Listen for URL changes to detect conversation ID
    window.addEventListener('popstate', this.checkUrlForConversationId);
    window.addEventListener('hashchange', this.checkUrlForConversationId);
    
    // Add MutationObserver to detect URL changes in SPAs that don't trigger popstate
    this.observeUrlChanges();
    
    // Initial check for conversation ID
    this.checkUrlForConversationId();
    
    // Listen for conversation data events
    document.addEventListener('jaydai:conversation-list', handleConversationList);
    document.addEventListener('jaydai:specific-conversation', handleSpecificConversation);
    document.addEventListener('jaydai:chat-completion', handleChatCompletion);
    document.addEventListener('jaydai:assistant-response', handleAssistantResponse);
  }
  
  protected onCleanup(): void {
    window.removeEventListener('popstate', this.checkUrlForConversationId);
    window.removeEventListener('hashchange', this.checkUrlForConversationId);
    
    if (this.urlObserver) {
      this.urlObserver.disconnect();
      this.urlObserver = null;
    }
    
    document.removeEventListener('jaydai:conversation-list', handleConversationList);
    document.removeEventListener('jaydai:specific-conversation', handleSpecificConversation);
    document.removeEventListener('jaydai:chat-completion', handleChatCompletion);
    document.removeEventListener('jaydai:assistant-response', handleAssistantResponse);
    
  }
  
  private observeUrlChanges(): void {
    try {
      let lastUrl = window.location.href;
      
      this.urlObserver = new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          lastUrl = currentUrl;
          this.checkUrlForConversationId();
        }
      });
      
      this.urlObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    } catch (error) {
      console.error('Error setting up URL observer:', error);
    }
  }

  /**
   * Check URL for conversation ID using platform-specific patterns from config
   */
  private checkUrlForConversationId = (): void => {
    try {
      // Get current platform's config
      const platformName = this.currentPlatform || detectPlatform();
      const config = getConfigByName(platformName);
      
      if (!config) {
        return;
      }
      
      // Check if any of the patterns match the current URL
      let foundConversationId: string | null = null;
      
      // Try URL path patterns
      for (const pattern of config.conversationIdPatterns) {
        if (pattern.urlPath) {
          const match = window.location.pathname.match(pattern.urlPath);
          if (match && match[1]) {
            foundConversationId = match[1];
            break;
          }
        }
        
        // Try query parameter if specified
        if (pattern.queryParam) {
          const urlParams = new URLSearchParams(window.location.search);
          const paramValue = urlParams.get(pattern.queryParam);
          if (paramValue) {
            foundConversationId = paramValue;
            break;
          }
        }
      }
      
      // Update conversation ID if we found one and it's different
      if (foundConversationId && foundConversationId !== this.currentConversationId) {
        this.setCurrentConversationId(foundConversationId);
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error checking URL for conversation ID', ErrorCode.EXTENSION_ERROR, error)
      );
    }
  };

  /**
   * Get current conversation ID
   */
  public getCurrentConversationId(): string | null {
    return this.currentConversationId;
  }
  
  /**
   * Set current conversation ID
   */
  public setCurrentConversationId(conversationId: string): void {
    if (this.currentConversationId === conversationId) return;
    
    this.currentConversationId = conversationId;
    
    // Emit event for conversation change - both new app event and custom event
    emitEvent(AppEvent.CHAT_CONVERSATION_CHANGED, { conversationId });
    trackEvent(EVENTS.CHAT_CONVERSATION_CHANGED, {
      conversationId,
      platform: this.currentPlatform
    });
    // Also dispatch custom event for components that listen to it directly
    document.dispatchEvent(new CustomEvent('jaydai:conversation-changed', {
      detail: { conversationId }
    }));
  }
  
  /**
   * Manually set conversation ID from external source
   * This is useful when we know the ID from an API response
   */
  public setConversationIdFromResponse(conversationId: string): void {
    if (!conversationId || conversationId === '') return;
    
    this.setCurrentConversationId(conversationId);
  }
}

export const chatService = ChatService.getInstance();