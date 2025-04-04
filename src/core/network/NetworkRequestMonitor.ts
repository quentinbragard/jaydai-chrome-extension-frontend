// src/core/network/NetworkRequestMonitor.ts
// Legacy compatibility layer for the NetworkRequestMonitor
// This file provides backward compatibility for code that depends on the old NetworkRequestMonitor

/**
 * Simple interface for network event listeners
 */
export type NetworkEventListener = (data: any) => void;

// Legacy event type to specific event mapping
const TYPE_TO_EVENT = {
  'userInfo': 'jaydai:user-info',
  'conversationList': 'jaydai:conversation-list',
  'specificConversation': 'jaydai:specific-conversation',
  'chatCompletion': 'jaydai:chat-completion',
  'assistantResponse': 'jaydai:assistant-response'
};

/**
 * Simplified network request monitor - now just a compatibility layer
 * This version uses direct event listeners instead of the previous implementation
 */
export class NetworkRequestMonitor {
  private static instance: NetworkRequestMonitor;
  private isInitialized: boolean = false;
  
  private constructor() {
    console.warn('NetworkRequestMonitor is deprecated. Use direct event listeners instead.');
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): NetworkRequestMonitor {
    if (!NetworkRequestMonitor.instance) {
      NetworkRequestMonitor.instance = new NetworkRequestMonitor();
    }
    return NetworkRequestMonitor.instance;
  }
  
  /**
   * Initialize the monitor
   */
  public initialize(): boolean {
    if (this.isInitialized) return true;
    this.isInitialized = true;
    return true;
  }
  
  /**
   * Register a listener for a specific pattern or event type
   * Now this converts to a direct event listener
   */
  public addListener(pattern: string | RegExp, callback: NetworkEventListener): () => void {
    const eventName = typeof pattern === 'string' && pattern in TYPE_TO_EVENT 
      ? TYPE_TO_EVENT[pattern as keyof typeof TYPE_TO_EVENT]
      : null;
    
    if (eventName) {
      // We have a direct event mapping
      const wrappedCallback = (event: CustomEvent) => callback(event.detail);
      document.addEventListener(eventName, wrappedCallback as EventListener);
      
      // Return cleanup function
      return () => {
        document.removeEventListener(eventName, wrappedCallback as EventListener);
      };
    } else {
      console.warn(`NetworkRequestMonitor: No direct event mapping for pattern "${pattern}"`);
      // Return a no-op cleanup function
      return () => {};
    }
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.isInitialized = false;
  }
}

// Export singleton instance
export const networkRequestMonitor = NetworkRequestMonitor.getInstance();