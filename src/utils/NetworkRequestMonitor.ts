// src/utils/NetworkRequestMonitor.ts
export class NetworkRequestMonitor {
  private static instance: NetworkRequestMonitor;
  private isInitialized: boolean = false;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private urlPatterns: string[] = [];
  private regexPatterns: Map<string, RegExp> = new Map();
  private boundEventHandler: (event: CustomEvent) => void;
  
  private constructor() {
    // Create bound event handler once to avoid recreation
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
   * Initialize the monitor - simplified
   */
  public initialize(): boolean {
    if (this.isInitialized) return true;
    
    try {
      console.log('🔍 Initializing network request monitor');
      
      // Notify background script that we're starting monitoring
      // Use a timeout to avoid blocking initialization
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'start-network-monitoring' }, (response) => {
          if (response && response.success) {
            console.log('✅ Background acknowledged network monitoring');
          } else {
            console.log('⚠️ Using fallback monitor approach');
          }
        });
      }, 0);
      
      // Listen for network interception events from injected script
      document.addEventListener('archimind-network-intercept', this.boundEventHandler as EventListener);
      
      this.isInitialized = true;
      console.log('✅ Network request monitor initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing network monitor:', error);
      return false;
    }
  }
  
  /**
   * Handle a captured request - optimized with debounce
   */
  private handleCapturedRequest(event: CustomEvent): void {
    // Don't block the main thread
    setTimeout(() => {
      try {
        const detail = event.detail;
        if (!detail || !detail.data || !detail.data.url) return;
        
        const data = detail.data;
        const url = data.url;
        const type = detail.type;
        
        // Process for all registered listeners - both regex and string patterns
        this.processListenersForUrl(url, type, data);
      } catch (error) {
        console.error('❌ Error handling captured request:', error);
      }
    }, 0);
  }
  
  /**
   * Process listeners for a URL
   */
  private processListenersForUrl(url: string, type: string, data: any): void {
    // First check string patterns
    for (const pattern of this.urlPatterns) {
      if (url.includes(pattern)) {
        this.notifyListeners(pattern, data);
      }
    }
    
    // Then check regex patterns
    this.regexPatterns.forEach((regex, patternKey) => {
      if (regex.test(url)) {
        this.notifyListeners(patternKey, data);
      }
    });
    
    // Also notify any listeners registered directly for this endpoint type
    this.notifyListeners(type, data);
  }
  
  /**
   * Notify listeners for a specific pattern
   */
  private notifyListeners(pattern: string, data: any): void {
    const listeners = this.listeners.get(pattern) || [];
    
    // Process each listener in a separate tick
    listeners.forEach((listener, index) => {
      // Stagger listener execution to prevent thread blocking
      setTimeout(() => {
        try {
          listener(data);
        } catch (error) {
          console.error(`❌ Error in listener for ${pattern}:`, error);
        }
      }, index * 5); // 5ms between listeners
    });
  }
  
  /**
   * Register a listener for specific API endpoint patterns
   * @param urlPattern URL pattern to match (string or RegExp)
   * @param callback Function to call when a matching request is intercepted
   * @returns Function to remove this listener
   */
  public addListener(urlPattern: string | RegExp, callback: (data: any) => void): () => void {
    let patternKey: string;
    
    if (urlPattern instanceof RegExp) {
      // For RegExp patterns, use a string key with a unique identifier
      patternKey = `regex:${urlPattern.toString()}`;
      this.regexPatterns.set(patternKey, urlPattern);
    } else {
      // For string patterns
      patternKey = urlPattern;
      if (!this.urlPatterns.includes(patternKey)) {
        this.urlPatterns.push(patternKey);
      }
    }
    
    // Set up the listeners array for this pattern if it doesn't exist
    if (!this.listeners.has(patternKey)) {
      this.listeners.set(patternKey, []);
    }
    
    // Add the callback to the listeners for this pattern
    const listeners = this.listeners.get(patternKey)!;
    listeners.push(callback);
    
    // Return a function to remove this listener
    return () => {
      const listenersArray = this.listeners.get(patternKey) || [];
      const index = listenersArray.indexOf(callback);
      if (index !== -1) {
        listenersArray.splice(index, 1);
        
        // If there are no more listeners for this pattern, clean it up
        if (listenersArray.length === 0) {
          this.listeners.delete(patternKey);
          
          if (urlPattern instanceof RegExp) {
            this.regexPatterns.delete(patternKey);
          } else {
            const patternIndex = this.urlPatterns.indexOf(patternKey);
            if (patternIndex !== -1) {
              this.urlPatterns.splice(patternIndex, 1);
            }
          }
        }
      }
    };
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Tell background script to stop monitoring - don't block
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'stop-network-monitoring' });
    }, 0);
    
    // Remove event listener
    document.removeEventListener('archimind-network-intercept', this.boundEventHandler as EventListener);
    
    // Clear all listeners
    this.listeners.clear();
    this.urlPatterns = [];
    this.regexPatterns.clear();
    
    this.isInitialized = false;
    console.log('✅ Network request monitor cleaned up');
  }
}

// Export singleton instance
export const networkRequestMonitor = NetworkRequestMonitor.getInstance();