// src/utils/NetworkRequestMonitor.ts
/**
 * Monitors network requests intercepted by the injected script
 * Optimized for efficiency and performance
 */
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
   * Initialize the monitor
   */
  public initialize(): boolean {
    if (this.isInitialized) return true;
    
    try {
      console.log('🔍 Initializing network request monitor');
      
      // Notify background script to start monitoring
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'start-network-monitoring' }, (response) => {
          if (response && response.success) {
            console.log('✅ Background script acknowledged network monitoring');
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
   * Handle a captured request with efficient event throttling
   */
  private handleCapturedRequest(event: CustomEvent): void {
    // Process in next tick to avoid blocking the main thread
    setTimeout(() => {
      try {
        const detail = event.detail;
        if (!detail || !detail.data) return;
        
        const data = detail.data;
        const url = data.url || '';
        const type = detail.type;
        
        // Process for all registered listeners - both regex and string patterns
        this.processListenersForUrl(url, type, data);
      } catch (error) {
        console.error('❌ Error handling captured request:', error);
      }
    }, 0);
  }
  
  /**
   * Process listeners for a URL with optimized pattern matching
   */
  private processListenersForUrl(url: string, type: string, data: any): void {
    // Event type listeners have highest priority
    this.notifyListeners(type, data);
    
    // Check string patterns (fast path)
    for (const pattern of this.urlPatterns) {
      if (url.includes(pattern)) {
        this.notifyListeners(pattern, data);
      }
    }
    
    // Check regex patterns (slower path)
    this.regexPatterns.forEach((regex, patternKey) => {
      if (regex.test(url)) {
        this.notifyListeners(patternKey, data);
      }
    });
  }
  
  /**
   * Notify listeners for a specific pattern with debounced execution
   */
  private notifyListeners(pattern: string, data: any): void {
    const listeners = this.listeners.get(pattern);
    if (!listeners || listeners.length === 0) return;
    
    // Process each listener with minimal staggering for performance
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`❌ Error in listener for ${pattern}:`, error);
      }
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
    if (!this.isInitialized) return;
    
    // Tell background script to stop monitoring
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