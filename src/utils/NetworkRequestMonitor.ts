// src/utils/NetworkRequestMonitor.ts
/**
 * Utility to monitor and intercept network requests made by the page itself
 * Uses the browser's devtools protocol to capture network traffic
 */

export class NetworkRequestMonitor {
  private static instance: NetworkRequestMonitor;
  private isInitialized: boolean = false;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private urlPatterns: string[] = [];
  
  private constructor() {}
  
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
   * Initialize the monitor and set up message passing to background script
   */
  public initialize(): boolean {
    if (this.isInitialized) return true;
    
    try {
      // Set up listener for messages from the background script
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'network-request-captured') {
          this.handleCapturedRequest(message.data);
          sendResponse({ success: true });
        }
      });
      
      // Request the background script to start monitoring
      chrome.runtime.sendMessage(
        { action: 'start-network-monitoring' },
        (response) => {
          if (response && response.success) {
            this.isInitialized = true;
          } else {
            console.error('Failed to start network monitoring:', response?.error || 'Unknown error');
          }
        }
      );
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing network monitor:', error);
      return false;
    }
  }
  
  /**
   * Handle a request captured by the background script
   */
  private handleCapturedRequest(data: any): void {
    console.log('======================handleCapturedRequest', data);
    if (!data || !data.url) return;
    
    // Check against registered URL patterns
    for (const pattern of this.urlPatterns) {
      if (data.url.includes(pattern)) {
        const listeners = this.listeners.get(pattern) || [];
        for (const listener of listeners) {
          try {
            listener(data);
          } catch (error) {
            console.error(`Error in listener for ${pattern}:`, error);
          }
        }
      }
    }
  }
  
  /**
   * Register a listener for specific API endpoint patterns
   */
  public addListener(urlPattern: string, callback: (data: any) => void): () => void {
    if (!this.urlPatterns.includes(urlPattern)) {
      this.urlPatterns.push(urlPattern);
    }
    
    if (!this.listeners.has(urlPattern)) {
      this.listeners.set(urlPattern, []);
    }
    
    this.listeners.get(urlPattern)!.push(callback);
    
    // Return a function to remove this listener
    return () => {
      const listeners = this.listeners.get(urlPattern) || [];
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (!this.isInitialized) return;
    
    // Tell background script to stop monitoring
    chrome.runtime.sendMessage({ action: 'stop-network-monitoring' });
    
    // Clear all listeners
    this.listeners.clear();
    this.urlPatterns = [];
    
    this.isInitialized = false;
  }
}

// Export singleton instance
export const networkRequestMonitor = NetworkRequestMonitor.getInstance();