// src/content/injectedInterceptor.js
// This script will be injected into the page context to intercept network requests

(function() {
  // Store original methods before overriding
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  // Define endpoints we're interested in - EXPANDED to include specific conversation endpoints
  const ENDPOINTS = {
    USER_INFO: '/backend-api/me',
    CONVERSATIONS_LIST: '/backend-api/conversations',
    CHAT_COMPLETION: '/backend-api/conversation',
    SPECIFIC_CONVERSATION: new RegExp('/backend-api/conversation/[a-z0-9-]+$')
  };
  
  // Track processed requests to avoid duplicates
  const processedRequests = new Set();
  
  /**
   * Send intercepted data back to the extension
   */
  function sendToExtension(type, data) {
    // Create and dispatch a custom event
    const event = new CustomEvent('archimind-network-intercept', {
      detail: {
        type,
        data,
        timestamp: Date.now()
      }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Check if a URL matches our target endpoints
   */
  function getEndpointType(url) {
    if (!url) return null;
    
    // Parse the URL to get the pathname
    let pathname;
    try {
      // For full URLs
      if (url.startsWith('http')) {
        pathname = new URL(url).pathname;
      } else {
        // For relative URLs
        pathname = url.split('?')[0];
      }
    } catch (e) {
      // If URL parsing fails, use the original URL
      pathname = url;
    }

    console.log("pathname", pathname)
    
    // Check for user info endpoint - exact match for /backend-api/me
    if (pathname === ENDPOINTS.USER_INFO) {
      return 'userInfo';
    }
    
    // Check for specific conversation detail endpoint
    if (ENDPOINTS.SPECIFIC_CONVERSATION.test(pathname)) {
      return 'specificConversation';
    }
    
    // Check for conversations list endpoint
    if (pathname.startsWith(ENDPOINTS.CONVERSATIONS_LIST)) {
      return 'conversationList';
    }
    
    // Check for chat completion endpoint
    if (pathname.startsWith(ENDPOINTS.CHAT_COMPLETION)) {
      return 'chatCompletion';
    }
    
    return null;
  }
  
  /**
   * Override fetch API to intercept requests
   */
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const requestId = `${url}-${Date.now()}`;
    
    // Get the endpoint type
    const endpointType = getEndpointType(url);
    if (endpointType) {
      console.log("=====================================================")
      console.log("endpointType", endpointType)
      console.log("url", url) 
    }
    
    let requestBody = null;
    
    // Extract request body if present
    if (init && init.body) {
      try {
        const bodyText = typeof init.body === 'string' 
          ? init.body 
          : new TextDecoder().decode(init.body);
          
        if (bodyText.trim().startsWith('{')) {
          requestBody = JSON.parse(bodyText);
        }
      } catch (e) {
        // Silently fail if we can't parse
      }
    }
    console.log("requestBody", requestBody)

    
    // Call original fetch
    const response = await originalFetch.apply(this, arguments);
    console.log("response", response)
    console.log("=====================================================")
    
    // Only process if it's an endpoint we care about
    if (endpointType && !processedRequests.has(requestId)) {
      processedRequests.add(requestId);
      
      // Clean up processedRequests if it gets too large
      if (processedRequests.size > 1000) {
        const oldestEntries = Array.from(processedRequests).slice(0, 500);
        oldestEntries.forEach(entry => processedRequests.delete(entry));
      }
      
      // Clone the response to avoid consuming it
      const clonedResponse = response.clone();
      
      // Process response based on type
      try {
        const isStreaming = clonedResponse.headers.get('content-type')?.includes('text/event-stream') || false;
        
        if (!isStreaming) {
          // For normal JSON responses
          clonedResponse.json().then(data => {
            sendToExtension(endpointType, {
              url,
              requestBody,
              responseBody: data,
              method: init?.method || 'GET',
              isStreaming: false
            });
          }).catch(e => {
            // Error parsing response JSON
            console.error('Error parsing JSON from response:', e);
          });
        } else if (endpointType === 'chatCompletion') {
          // For streaming responses, we need special handling
          sendToExtension(endpointType, {
            url,
            requestBody,
            method: init?.method || 'GET',
            isStreaming: true,
            // We can't send the actual stream, just metadata
            metadata: {
              url,
              headers: Object.fromEntries(clonedResponse.headers.entries()),
              status: clonedResponse.status
            }
          });
        }
      } catch (error) {
        // Error processing intercepted fetch
        console.error('Error processing intercepted fetch:', error);
      }
    }
    
    // Return original response
    return response;
  };
  
  /**
   * Override XMLHttpRequest to intercept requests
   */
  XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    this._method = method;
    
    return originalXHROpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    const url = this._url;
    const method = this._method;
    const endpointType = getEndpointType(url);
    const requestId = `xhr-${url}-${Date.now()}`;
    
    // Parse request body if possible
    let requestBody = null;
    if (body) {
      try {
        const bodyText = body.toString();
        if (bodyText.trim().startsWith('{')) {
          requestBody = JSON.parse(bodyText);
        }
      } catch (e) {
        // Silently fail if parsing fails
      }
    }
    
    // Only add listener if it's an endpoint we care about
    if (endpointType && !processedRequests.has(requestId)) {
      processedRequests.add(requestId);
      
      // Add load event listener
      this.addEventListener('load', function() {
        if (this.status >= 200 && this.status < 300) {
          try {
            const responseText = this.responseText;
            if (responseText) {
              let responseData;
              try {
                responseData = JSON.parse(responseText);
              } catch (e) {
                responseData = { rawText: responseText.substring(0, 1000) };
              }
              
              sendToExtension(endpointType, {
                url,
                requestBody,
                responseBody: responseData,
                method,
                isStreaming: false
              });
            }
          } catch (error) {
            // Error processing XHR response
            console.error('Error processing XHR response:', error);
          }
        }
      });
    }
    
    // Call original send
    return originalXHRSend.apply(this, arguments);
  };
  
  // Notify that injection is complete
  sendToExtension('injectionComplete', { status: 'success' });
  console.log('ChatGPT Network Interceptor injected successfully');
})();