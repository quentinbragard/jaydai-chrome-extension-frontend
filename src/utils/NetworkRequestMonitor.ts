// src/utils/NetworkRequestMonitor.ts
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
   * Initialize the monitor - simplified
   */
  public initialize(): boolean {
    if (this.isInitialized) return true;
    
    try {
      console.log('🔍 Initializing simplified network request monitor');
      
      // Notify background script that we're starting monitoring
      chrome.runtime.sendMessage({ action: 'start-network-monitoring' }, (response) => {
        // Just log the response, but we don't need to rely on it
        if (response && response.success) {
          console.log('✅ Background acknowledged network monitoring');
        } else {
          console.log('⚠️ Using fallback monitor approach');
        }
      });
      
      // Listen for network interception events from injected script
      document.addEventListener('archimind-network-intercept', (event: any) => {
        if (event.detail && event.detail.data) {
          this.handleCapturedRequest(event.detail.data);
        }
      });
      
      this.isInitialized = true;
      console.log('✅ Network request monitor initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing network monitor:', error);
      return false;
    }
  }
  
  /**
   * Handle a captured request
   */
  private handleCapturedRequest(data: any): void {
    if (!data || !data.url) return;
    
    // Check against registered URL patterns
    for (const pattern of this.urlPatterns) {
      if (data.url.includes(pattern)) {
        const listeners = this.listeners.get(pattern) || [];
        for (const listener of listeners) {
          try {
            listener(data);
          } catch (error) {
            console.error(`❌ Error in listener for ${pattern}:`, error);
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
    // Tell background script to stop monitoring
    chrome.runtime.sendMessage({ action: 'stop-network-monitoring' });
    
    // Remove event listener
    document.removeEventListener('archimind-network-intercept', this.handleCapturedRequest as EventListener);
    
    // Clear all listeners
    this.listeners.clear();
    this.urlPatterns = [];
    
    this.isInitialized = false;
    console.log('✅ Network request monitor cleaned up');
  }
}

// Export singleton instance
export const networkRequestMonitor = NetworkRequestMonitor.getInstance();