// src/content/injectedInterceptor.js
// This script will be injected into the page context to intercept network requests

(function() {
  // Store original methods before overriding
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  // Define endpoints we're interested in
  const ENDPOINTS = {
    USER_INFO: '/backend-api/me',
    CONVERSATIONS_LIST: '/backend-api/conversations',
    CHAT_COMPLETION: '/backend-api/conversation',
    SPECIFIC_CONVERSATION: new RegExp('/backend-api/conversation/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$')
  };
  
  // Precise endpoint type detection
  function getEndpointType(url) {
    if (!url) return null;
    
    let pathname;
    try {
      pathname = url.startsWith('http') 
        ? new URL(url).pathname 
        : url.split('?')[0];
    } catch (e) {
      pathname = url;
    }
    
    // Specific conversation check
    if (ENDPOINTS.SPECIFIC_CONVERSATION.test(pathname)) {
      const match = pathname.match(ENDPOINTS.SPECIFIC_CONVERSATION);
      const chatId = match ? match[1] : null;
      console.log(`🔍 Detected specific conversation: ${chatId}`);
      return 'specificConversation';
    }
    
    if (pathname === ENDPOINTS.USER_INFO) return 'userInfo';
    
    if (pathname.startsWith(ENDPOINTS.CONVERSATIONS_LIST)) {
      return 'conversationList';
    }
    
    if (pathname.startsWith(ENDPOINTS.CHAT_COMPLETION) && 
        !ENDPOINTS.SPECIFIC_CONVERSATION.test(pathname)) {
      return 'chatCompletion';
    }
    
    return null;
  }
  
  // Track processed requests to avoid duplicates
  const processedRequests = new Set();
  const MAX_PROCESSED_REQUESTS = 200;
  
  /**
   * Send intercepted data back to the extension
   */
  function sendToExtension(type, data) {
    try {
      const event = new CustomEvent('archimind-network-intercept', {
        detail: {
          type,
          data,
          timestamp: Date.now()
        }
      });
      
      document.dispatchEvent(event);
    } catch (error) {
      console.error(`Error dispatching ${type} event:`, error);
    }
  }
  
  /**
   * Process streaming responses
   */
  function processStreamingResponse(response, url, requestBody) {
    const clonedResponse = response.clone();
    const reader = clonedResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    function processStream() {
      reader.read().then(({ done, value }) => {
        if (done) {
          console.log("********************BUFFER********************", buffer);
          // Send complete buffer when stream is finished
          sendToExtension('streamedChatCompletion', {
            buffer,
            requestBody  // Include original request body for context
          });
          return;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Continue reading
        processStream();
      }).catch(error => {
        console.error('Stream reading error:', error);
      });
    }
    
    // Start processing
    processStream();
  }

  /**
   * Override fetch API to intercept requests
   */
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const requestId = `${url}-${Date.now()}`;
    
    // Get the endpoint type
    const endpointType = getEndpointType(url);
    
    // Skip processing if not an endpoint we care about
    if (!endpointType) {
      return originalFetch.apply(this, arguments);
    }
    
    // Skip if already processed
    if (processedRequests.has(requestId)) {
      return originalFetch.apply(this, arguments);
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
    
    // Add to processed requests with limit
    processedRequests.add(requestId);
    if (processedRequests.size > MAX_PROCESSED_REQUESTS) {
      const oldestEntries = Array.from(processedRequests).slice(0, 50);
      oldestEntries.forEach(entry => processedRequests.delete(entry));
    }
    
    // Call original fetch
    const response = await originalFetch.apply(this, arguments);
    
    // Skip processing responses other than 200-299
    if (!response.ok) {
      return response;
    }
    
    // Process response based on type
    try {
      // Check if response is streaming
      const isStreaming = response.headers.get('content-type')?.includes('text/event-stream') || false;
      const isUserMessageRequest = requestBody.messages[0].author.role === "user"
      
      if (endpointType === 'chatCompletion') {
        if (isStreaming && isUserMessageRequest) {
          // Process streaming response
          sendToExtension('chatCompletion', { requestBody });
          processStreamingResponse(response, url, requestBody);
        } else {
          // Handle non-streaming response
          response.clone().json().then(data => {
            sendToExtension('chatCompletion', {
              requestBody,
            });
          }).catch(e => {
            console.error('Error parsing chat completion response:', e);
          });
        }
      } 
      else if (endpointType === 'specificConversation') {
        // Special handling for specific conversation endpoints
        response.clone().json().then(data => {
          sendToExtension('specificConversation', {
            url,
            requestBody,
            responseBody: data,
            method: init?.method || 'GET'
          });
        }).catch(e => {
          console.error(`Error parsing JSON for ${endpointType}:`, e);
        });
      }
      else if (!isStreaming) {
        // For other endpoint types
        response.clone().json().then(data => {
          sendToExtension(endpointType, {
            url,
            requestBody,
            responseBody: data,
            method: init?.method || 'GET'
          });
        }).catch(e => {
          console.error(`Error parsing JSON for ${endpointType}:`, e);
        });
      }
    } catch (error) {
      console.error('Error processing intercepted fetch:', error);
    }
    
    // Return original response
    return response;
  };
  
  // Add similar modifications to XMLHttpRequest if needed...
  
  // Notify that injection is complete
  sendToExtension('injectionComplete', { status: 'success' });
})();