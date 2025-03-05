// src/services/chat/NetworkInterceptor.ts
// Handles interception of network requests and responses

/**
 * Configuration for NetworkInterceptor
 */
export interface InterceptorConfig {
    // Callback for conversation list API
    onConversationList: (data: any) => void;
    // Callback for user info API
    onUserInfo: (data: any) => void;
    // Callback for chat completion API request/response
    onChatCompletion: (responseData: any, requestBody: any, url: string, isStreaming: boolean) => void;
  }
  
  /**
   * Service for intercepting network requests to capture ChatGPT API traffic
   */
  export class NetworkInterceptor {
    private originalFetch: typeof window.fetch;
    private originalXHR: typeof XMLHttpRequest;
    private config: InterceptorConfig;
    private isIntercepting = false;
    
    constructor(config: InterceptorConfig) {
      this.originalFetch = window.fetch;
      this.originalXHR = XMLHttpRequest;
      this.config = config;
    }
    
    /**
     * Start intercepting network requests
     */
    public startIntercepting(): void {
      if (this.isIntercepting) return;
      
      this.interceptFetch();
      this.interceptXHR();
      
      this.isIntercepting = true;
      console.log('🔍 Network interception started');
    }
    
    /**
     * Stop intercepting network requests
     */
    public stopIntercepting(): void {
      if (!this.isIntercepting) return;
      
      // Restore original network functions
      if (this.originalFetch) {
        window.fetch = this.originalFetch;
      }
      
      if (this.originalXHR) {
        window.XMLHttpRequest = this.originalXHR;
      }
      
      this.isIntercepting = false;
      console.log('✅ Network interception stopped');
    }
    
    /**
     * Intercept the fetch API
     */
    private interceptFetch(): void {
      const self = this;
      
      window.fetch = async function(input, init) {
        // Get URL and request data
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

        console.log("🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄 Fetch URL:", url);
        
        // Clone request body if it exists
        let requestBody = null;
        if (init && init.body) {
          try {
            // For JSON bodies, parse to object
            const bodyText = typeof init.body === 'string' 
              ? init.body 
              : new TextDecoder().decode(init.body as BufferSource);
              
            if (bodyText.trim().startsWith('{')) {
              requestBody = JSON.parse(bodyText);
            }
          } catch (e) {
            // Silently fail if we can't parse
          }
        }
        
        // Call original fetch
        const response = await self.originalFetch.call(this, input, init);
        
        // Process response based on URL
        try {
          if (!url) return response;
          
          // Clone response to avoid consuming it
          const clonedResponse = response.clone();
          
          // Detect API type and process accordingly
          if (url.includes('/backend-api/conversations') && url.includes('limit=')) {
            clonedResponse.json().then(data => {
              self.config.onConversationList(data);
            }).catch(error => {
              console.error('❌ Error processing conversation list:', error);
            });
          } 
          else if (url.includes('/backend-api/me')) {
            clonedResponse.json().then(data => {
              self.config.onUserInfo(data);
            }).catch(error => {
              console.error('❌ Error processing user info:', error);
            });
          }
          else if (self.isChatCompletionURL(url)) {
            const isStreaming = clonedResponse.headers.get('content-type')?.includes('text/event-stream') || false;
            self.config.onChatCompletion(clonedResponse, requestBody, url, isStreaming);
          }
        } catch (error) {
          console.error('❌ Error in fetch interception:', error);
        }
        
        // Return original response
        return response;
      };
    }
    
    /**
     * Intercept XMLHttpRequest
     */
    private interceptXHR(): void {
      const self = this;
      
      window.XMLHttpRequest = function() {
        const xhr = new self.originalXHR();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        
        let requestUrl = '';
        let requestBody = null;
        
        // Intercept open method to capture URL
        xhr.open = function() {
          requestUrl = arguments[1] || '';
          console.log("🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄 XHR URL:", requestUrl);
          return originalOpen.apply(this, arguments as any);
        };
        
        // Intercept send method to capture request body
        xhr.send = function(body) {
          if (body) {
            try {
              // Try to parse body if it's a string and looks like JSON
              const bodyStr = body.toString();
              if (bodyStr.trim().startsWith('{')) {
                requestBody = JSON.parse(bodyStr);
              }
            } catch (e) {
              // Silently fail parsing
            }
          }
          
          // Check if this is a URL we're interested in
          if (self.isChatCompletionURL(requestUrl) || 
              requestUrl.includes('/backend-api/conversations') ||
              requestUrl.includes('/backend-api/me')) {
            
            // Add response handler
            xhr.addEventListener('load', function() {
              try {
                if (xhr.status >= 200 && xhr.status < 300) {
                  if (requestUrl.includes('/backend-api/conversations') && requestUrl.includes('limit=')) {
                    self.config.onConversationList(JSON.parse(xhr.responseText));
                  }
                  else if (requestUrl.includes('/backend-api/me')) {
                    self.config.onUserInfo(JSON.parse(xhr.responseText));
                  }
                  else if (self.isChatCompletionURL(requestUrl)) {
                    // Check if it's a non-streaming response
                    const isStreaming = xhr.getResponseHeader('Content-Type')?.includes('text/event-stream') || false;
                    if (!isStreaming) {
                      self.config.onChatCompletion(JSON.parse(xhr.responseText), requestBody, requestUrl, false);
                    }
                  }
                }
              } catch (error) {
                console.error('❌ Error processing XHR response:', error);
              }
            });
          }
          
          // Call original send
          return originalSend.apply(this, arguments as any);
        };
        
        return xhr;
      } as any;
    }
    
    /**
     * Check if a URL is for a chat completion API
     */
    private isChatCompletionURL(url: string): boolean {
      return url.includes('api.openai.com/v1/chat/completions') || 
             url.includes('chatgpt.com/backend-api/conversation');
    }
  }