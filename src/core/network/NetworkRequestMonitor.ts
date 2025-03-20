// src/utils/NetworkRequestMonitor.ts

/**
 * Simple interface for network event listeners
 */
export type NetworkEventListener = (data: any) => void;

/**
 * Simplified network request monitor
 */
export class NetworkRequestMonitor {
  private static instance: NetworkRequestMonitor;
  private isInitialized: boolean = false;
  private listeners: Map<string, Set<NetworkEventListener>> = new Map();
  private boundEventHandler: (event: CustomEvent) => void;
  
  private constructor() {
    this.boundEventHandler = this.handleCapturedRequest.bind(this);
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
    
    try {
      // Start listening for network interception events
      document.addEventListener('archimind-network-intercept', this.boundEventHandler as EventListener);
            
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Network monitor initialization error:', error);
      return false;
    }
  }
  
  /**
   * Handle a captured request
   */
  private handleCapturedRequest(event: CustomEvent): void {
    const detail = event.detail;
    if (!detail) return;
    
    const { type, data } = detail;
    
    // Notify type-specific listeners
    this.notifyListeners(type, data);
    
    // Also notify URL-pattern listeners if URL is present
    if (data?.url) {
      this.listeners.forEach((callbacks, pattern) => {
        if (typeof pattern === 'string' && data.url.includes(pattern)) {
          this.notifyListeners(pattern, data);
        } else if (pattern instanceof RegExp && pattern.test(data.url)) {
          this.notifyListeners(pattern.toString(), data);
        }
      });
    }
  }
  
  /**
   * Notify registered listeners for a specific pattern
   */
  private notifyListeners(pattern: string, data: any): void {
    const listeners = this.listeners.get(pattern);
    if (!listeners || listeners.size === 0) return;
    
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Listener error for ${pattern}:`, error);
      }
    });
  }
  
  /**
   * Register a listener for a specific URL pattern or event type
   */
  public addListener(pattern: string | RegExp, callback: NetworkEventListener): () => void {
    const patternKey = pattern instanceof RegExp ? pattern.toString() : pattern;
    
    if (!this.listeners.has(patternKey)) {
      this.listeners.set(patternKey, new Set());
    }
    
    this.listeners.get(patternKey)!.add(callback);
    
    // Return a function to remove this listener
    return () => {
      const callbacks = this.listeners.get(patternKey);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(patternKey);
        }
      }
    };
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (!this.isInitialized) return;
    
    document.removeEventListener('archimind-network-intercept', this.boundEventHandler as EventListener);
    chrome.runtime.sendMessage({ action: 'stop-network-monitoring' });
    
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const networkRequestMonitor = NetworkRequestMonitor.getInstance();