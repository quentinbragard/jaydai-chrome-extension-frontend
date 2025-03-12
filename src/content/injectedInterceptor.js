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

    
    try {
      // Create and dispatch a custom event
      const event = new CustomEvent('archimind-network-intercept', {
        detail: {
          type,
          data,
          timestamp: Date.now()
        }
      });
      
      // Dispatch the event
      document.dispatchEvent(event);
      
      // Verify event was dispatched
    } catch (error) {
      console.error(`❌ Error dispatching ${type} event:`, error);
    }
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
    
    // Check for specific conversation detail endpoint (check this first since it's more specific)
    if (ENDPOINTS.SPECIFIC_CONVERSATION.test(pathname)) {
      return 'specificConversation';
    }
    
    // Check for user info endpoint - exact match for /backend-api/me
    if (pathname === ENDPOINTS.USER_INFO) {
      return 'userInfo';
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
 * Process a streaming response and send delta events to the extension
 * This version adds better debugging and handling of the delta events
 */
function processStreamingResponse(response, url, requestBody) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let assistantAnswer = '';
  let messageId = null;
  let modelId = null;
  let conversationId = requestBody?.conversation_id || null;
  let realResponseStarted = false;
  
  reader.read().then(function processChunk({ done, value }) {

    
    // Decode and add to buffer
    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;
    
    // Process complete events in the buffer
    const events = buffer.split('\n\n');
    buffer = events.pop() || ''; // Keep the last incomplete chunk in the buffer
    
    for (const event of events) {
      if (!event.trim()) continue;
      
      const dataMatch = event.match(/data: (.+)$/m);
      if (!dataMatch) continue;
      const eventMatch = event.match(/event: (.+)$/m);
      
      // Skip [DONE] marker
      if (dataMatch[1].trim() === '[DONE]') continue;
      
      try {
        const delta = JSON.parse(dataMatch[1]);
        
        // CASE 1: Initial message creation
        if (delta.v && delta.v.message) {
          messageId = delta.v.message.id;
          modelId = delta.v.message.metadata?.model_slug || 'unknown';
          conversationId = delta.v.conversation_id || conversationId;

        }
        
        // CASE 2: Content append - with path (actual assistant response)
        else if (delta.o === 'append' && delta.p?.includes('/message/content/parts/') && typeof delta.v === 'string') {
          realResponseStarted = true; // Mark that we're now receiving the real response
          assistantAnswer += delta.v;
        }
        
        // CASE 3: Direct string values - only append if it's NOT a thinking step
        // This is the key change - we only include direct string values if we've already started a real response
        else if (typeof delta.v === 'string' && realResponseStarted) {
          assistantAnswer += delta.v;
        }
        
        // CASE 4: Completion signals
        else if (delta.p?.includes('/message/metadata') && delta.v?.is_complete) {
          if (realResponseStarted) {
            sendToExtension('streamingComplete', {
              url,
              conversationId,
              messageId,
              content: assistantAnswer,
              model: modelId
            });
          }
        }
        
        // CASE 5: Another completion format (finished_successfully)
        else if (Array.isArray(delta.v) && delta.v.some(item => item.v === "finished_successfully")) {
          if (realResponseStarted) {
            sendToExtension('streamingComplete', {
              url,
              conversationId,
              messageId,
              content: assistantAnswer,
              model: modelId
            });
          }
        }
      } catch (e) {
        // Skip unparseable data
      }
    }
    
    // Continue reading
    return reader.read().then(processChunk);
  }).catch(error => {
    // Notify about error
    sendToExtension('streamingError', {
      url,
      error: error.message,
      conversationId
    });
  });
}

  /**
   * Override fetch API to intercept requests
   */
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const requestId = `${url}-${Date.now()}`;
    
    // Get the endpoint type
    const endpointType = getEndpointType(url);
    
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
    
    // Call original fetch
    const response = await originalFetch.apply(this, arguments);
    
    // Only process if it's an endpoint we care about
    if (endpointType && !processedRequests.has(requestId)) {
      processedRequests.add(requestId);
      
      // Clean up processedRequests if it gets too large
      if (processedRequests.size > 1000) {
        const oldestEntries = Array.from(processedRequests).slice(0, 500);
        oldestEntries.forEach(entry => processedRequests.delete(entry));
      }
      
      // Process response based on type
      try {
        // Check if response is streaming (text/event-stream)
        const isStreaming = response.headers.get('content-type')?.includes('text/event-stream') || false;
        
        if (endpointType === 'chatCompletion') {
          // For streaming responses
          if (isStreaming) {
            // Clone the response to avoid consuming it
            const streamClone = response.clone();
            
            // Send basic metadata to extension
            sendToExtension(endpointType, {
              url,
              requestBody,
              method: init?.method || 'GET',
              isStreaming: true,
              metadata: {
                url,
                headers: Object.fromEntries(response.headers.entries()),
                status: response.status
              }
            });
            
            // Process the stream
            processStreamingResponse(streamClone, url, requestBody);
          } else {
            // Handle non-streaming responses
            response.clone().json().then(data => {
              sendToExtension(endpointType, {
                url,
                requestBody,
                responseBody: data,
                method: init?.method || 'GET',
                isStreaming: false
              });
            }).catch(e => {
              console.error('Error parsing JSON from response:', e);
            });
          }
        } else if (!isStreaming) {
          // For other non-streaming endpoint types (userInfo, conversationList, specificConversation)
          response.clone().json().then(data => {
            sendToExtension(endpointType, {
              url,
              requestBody,
              responseBody: data,
              method: init?.method || 'GET',
              isStreaming: false
            });
          }).catch(e => {
            console.error(`Error parsing JSON for ${endpointType}:`, e);
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
})();