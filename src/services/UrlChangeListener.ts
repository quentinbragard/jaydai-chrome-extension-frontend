// src/services/chat/UrlChangeListener.ts
// Listens for URL changes to detect conversation changes

/**
 * Configuration for URL change listener
 */
export interface UrlListenerConfig {
    onUrlChange: (newUrl: string) => void;
  }
  
  /**
   * Service to detect URL changes in the ChatGPT interface
   */
  export class UrlChangeListener {
    private config: UrlListenerConfig;
    private intervalId: number | null = null;
    private lastUrl: string;
    private isListening: boolean = false;
    
    constructor(config: UrlListenerConfig) {
      this.config = config;
      this.lastUrl = window.location.href;
    }
    
    /**
     * Start listening for URL changes
     */
    public startListening(): void {
      if (this.isListening) return;
      
      // Set up polling for URL changes
      this.intervalId = window.setInterval(() => {
        this.checkForUrlChanges();
      }, 1000);
      
      // Hook into History API
      this.hookHistoryApi();
      
      this.isListening = true;
      console.log('👂 Started listening for URL changes');
    }
    
    /**
     * Stop listening for URL changes
     */
    public stopListening(): void {
      if (!this.isListening) return;
      
      // Clear interval
      if (this.intervalId) {
        window.clearInterval(this.intervalId);
        this.intervalId = null;
      }
      
      this.isListening = false;
      console.log('✅ Stopped listening for URL changes');
    }
    
    /**
     * Hook into History API to detect programmatic navigation
     */
    private hookHistoryApi(): void {
      // Store original methods
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      const self = this;
      
      // Override pushState
      history.pushState = function() {
        // Call original method
        const result = originalPushState.apply(this, arguments as any);
        
        // Notify about URL change
        self.handleUrlChange(window.location.href);
        
        return result;
      };
      
      // Override replaceState
      history.replaceState = function() {
        // Call original method
        const result = originalReplaceState.apply(this, arguments as any);
        
        // Notify about URL change
        self.handleUrlChange(window.location.href);
        
        return result;
      };
      
      // Listen for popstate event (browser back/forward)
      window.addEventListener('popstate', () => {
        this.handleUrlChange(window.location.href);
      });
    }
    
    /**
     * Check for URL changes via polling
     */
    private checkForUrlChanges(): void {
      const currentUrl = window.location.href;
      
      if (currentUrl !== this.lastUrl) {
        this.handleUrlChange(currentUrl);
      }
    }
    
    /**
     * Handle URL change
     */
    private handleUrlChange(newUrl: string): void {
      if (newUrl === this.lastUrl) return;
      
      console.log(`🔄 URL changed: ${this.lastUrl} -> ${newUrl}`);
      this.lastUrl = newUrl;
      
      // Notify via callback
      this.config.onUrlChange(newUrl);
    }
    
    /**
     * Extract chat ID from URL
     */
    public static extractChatIdFromUrl(url: string): string | null {
      try {
        const parsedUrl = new URL(url);
        const match = parsedUrl.pathname.match(/\/c\/([^/?]+)/);
        return match ? match[1] : null;
      } catch (error) {
        console.error('❌ Error extracting chat ID from URL:', error);
        return null;
      }
    }
  }