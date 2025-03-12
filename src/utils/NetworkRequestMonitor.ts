// src/utils/NetworkRequestMonitor.ts

/**
 * Simplified network request monitor
 */
export class NetworkRequestMonitor {
  private static instance: NetworkRequestMonitor;
  private isInitialized: boolean = false;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
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
      // Notify background script to start monitoring
      chrome.runtime.sendMessage({ action: 'start-network-monitoring' });
      
      // Listen for network interception events
      document.addEventListener('archimind-network-intercept', this.boundEventHandler as EventListener);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Network monitor initialization error:', error);
      return false;
    }
  }
  
  /**
   * Handle a captured request efficiently
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
        if (data.url.includes(pattern)) {
          this.notifyListeners(pattern, data);
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
  public addListener(pattern: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(pattern)) {
      this.listeners.set(pattern, new Set());
    }
    
    this.listeners.get(pattern)!.add(callback);
    
    // Return a function to remove this listener
    return () => {
      const callbacks = this.listeners.get(pattern);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(pattern);
        }
      }
    };
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (!this.isInitialized) return;
    
    chrome.runtime.sendMessage({ action: 'stop-network-monitoring' });
    document.removeEventListener('archimind-network-intercept', this.boundEventHandler as EventListener);
    
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const networkRequestMonitor = NetworkRequestMonitor.getInstance();