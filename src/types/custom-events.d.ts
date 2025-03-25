/**
 * Custom Events Declaration File
 * This resolves all the errors about document.addEventListener with custom event types
 */

interface ArchimindEventMap {
    'archimind-network-intercept': CustomEvent<{
        type: string;
        data: any;
      }>;
      
      // Message events
      'archimind:message-extracted': CustomEvent<{
        message: import('./services/message').Message;
      }>;
      
    'archimind:queue-message': CustomEvent<{
      message: import('./services/message').Message;
    }>;
    
    // Conversation events
    'archimind:conversation-loaded': CustomEvent<{
      conversation: import('./services/conversation').Conversation;
      messages: import('./services/message').Message[];
    }>;
    'archimind:conversation-list': CustomEvent<{
      conversations: import('./services/conversation').Conversation[];
    }>;
    'archimind:conversation-changed': CustomEvent<{
      conversationId: string;
    }>;
    
    // Notification events
    'archimind:notification-count-changed': CustomEvent<{
      unreadCount: number;
    }>;
    'archimind:open-notifications': CustomEvent<void>;
    'archimind:open-settings': CustomEvent<void>;
    'archimind:open-templates': CustomEvent<void>;
    
    // Dialog events
    'archimind:show-auth-modal': CustomEvent<{
      mode: 'signin' | 'signup';
      isSessionExpired?: boolean;
    }>;
    'archimind:auth-error': CustomEvent<{
      errorCode: string;
    }>;
    'archimind:placeholder-editor-opened': CustomEvent<void>;
    'archimind:placeholder-editor-closed': CustomEvent<void>;
  }
  
  // Augment the Document interface to include our custom events
  declare global {
    interface Document {
      addEventListener<K extends keyof ArchimindEventMap>(
        type: K,
        listener: (this: Document, ev: ArchimindEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
      ): void;
      removeEventListener<K extends keyof ArchimindEventMap>(
        type: K,
        listener: (this: Document, ev: ArchimindEventMap[K]) => any,
        options?: boolean | EventListenerOptions
      ): void;
      dispatchEvent<K extends keyof ArchimindEventMap>(
        event: ArchimindEventMap[K]
      ): boolean;
    }
  }
  
  export {};