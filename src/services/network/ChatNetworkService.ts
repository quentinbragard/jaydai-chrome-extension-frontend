import { AbstractBaseService } from '../BaseService';
import { debug } from '@/core/config';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { emitEvent, AppEvent } from '@/core/events/events';
import { handleConversationList } from '@/platforms/platformManager';


export class ChatNetworkService extends AbstractBaseService {
    private static instance: ChatNetworkService;
    private currentConversationId: string | null = null;

    private constructor() {
        super();
    }

    public static getInstance(): ChatNetworkService {
        if (!ChatNetworkService.instance) {
            ChatNetworkService.instance = new ChatNetworkService();
        }
        return ChatNetworkService.instance;
    }

    protected async onInitialize(): Promise<void> {
        debug('Initializing ConversationManager');
        
        // Listen for URL changes to detect conversation ID
        window.addEventListener('popstate', this.checkUrlForConversationId);
        this.checkUrlForConversationId(); // Check current URL
        
        // Listen for conversation data events - using direct event listeners
        document.addEventListener('jaydai:conversation-list', handleConversationList);
      }
      
    protected onCleanup(): void {
        window.removeEventListener('popstate', this.checkUrlForConversationId);
        document.removeEventListener('jaydai:conversation-list', handleConversationList);
        debug('ConversationManager cleaned up');
      }
    
   /**
   * Check URL for conversation ID
   */
    private checkUrlForConversationId = (): void => {
        try {
        const match = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
        if (match && match[1]) {
            const conversationId = match[1];
            
            // Only update if different from current
            if (conversationId !== this.currentConversationId) {
            debug(`Detected conversation ID from URL: ${conversationId}`);
            this.setCurrentConversationId(conversationId);
            }
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
    
    // Also dispatch custom event for components that listen to it directly
    document.dispatchEvent(new CustomEvent('jaydai:conversation-changed', {
      detail: { conversationId }
    }));
  }
  
}
