// src/content/injectedInterceptor.js
// This script will be injected into the page context to intercept network requests

(function() {
  // Store original methods before overriding
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  // Define endpoints we're interested in - EXPANDED to better match conversation patterns
  const ENDPOINTS = {
    USER_INFO: '/backend-api/me',
    CONVERSATIONS_LIST: '/backend-api/conversations',
    CHAT_COMPLETION: '/backend-api/conversation',
    // Updated regex to ONLY match UUID-like chat IDs and exclude "init" and other keywords
    SPECIFIC_CONVERSATION: new RegExp('/backend-api/conversation/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$')
  };
  
  // And update the getEndpointType function to be more precise:
  
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
    // This will only match UUIDs and not keywords like "init"
    if (ENDPOINTS.SPECIFIC_CONVERSATION.test(pathname)) {
      // Extract the chat ID from the URL for logging
      const match = pathname.match(ENDPOINTS.SPECIFIC_CONVERSATION);
      const chatId = match ? match[1] : null;
      console.log(`🔍 Detected specific conversation endpoint for chat: ${chatId}`);
      return 'specificConversation';
    }
    
    // Other endpoint checks remain the same
    if (pathname === ENDPOINTS.USER_INFO) {
      return 'userInfo';
    }
    
    if (pathname.startsWith(ENDPOINTS.CONVERSATIONS_LIST)) {
      return 'conversationList';
    }
    
    // Make sure this doesn't match specific conversation endpoints we want to handle separately
    if (pathname.startsWith(ENDPOINTS.CHAT_COMPLETION) && !ENDPOINTS.SPECIFIC_CONVERSATION.test(pathname)) {
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
    } catch (error) {
      console.error(`Error dispatching ${type} event:`, error);
    }
  }
  

  /**
   * Process a streaming response and send delta events to the extension
   */
  function processStreamingResponse(response, url, requestBody) {
    // Clone the response to avoid consuming the original
    const clonedResponse = response.clone();
    const reader = clonedResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assistantAnswer = '';
    let messageId = null;
    let modelId = null;
    let conversationId = requestBody?.conversation_id || null;
    
    // We'll use a more efficient Promise-based approach
    function processStream() {
      reader.read().then(({ done, value }) => {
        // If stream is done, finalize
        if (done) {
          if (messageId && assistantAnswer) {
            sendToExtension('streamingComplete', {
              url,
              conversationId,
              messageId,
              content: assistantAnswer,
              model: modelId || 'unknown'
            });
          }
          return;
        }
        
        try {
          // Process this chunk
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Extract any complete events
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';
          
          // Process each event
          for (const event of events) {
            if (!event.trim()) continue;
            
            const dataMatch = event.match(/data: (.+)$/m);
            if (!dataMatch || dataMatch[1].trim() === '[DONE]') continue;
            
            try {
              const delta = JSON.parse(dataMatch[1]);
              
              // Extract message ID if available
              if (delta.message_id && !messageId) {
                messageId = delta.message_id;
              } else if (delta.id && !messageId) {
                messageId = delta.id;
              } else if (delta.v && delta.v.message && delta.v.message.id && !messageId) {
                messageId = delta.v.message.id;
                modelId = delta.v.message.metadata?.model_slug || modelId;
                conversationId = delta.v.conversation_id || conversationId;
              }
              
              // Extract content from appropriate delta types
              if (delta.o === 'append' && delta.p?.includes('/message/content/parts/') && typeof delta.v === 'string') {
                assistantAnswer += delta.v;
              } 
              // Handle direct content
              else if (delta.content || delta.delta?.content) {
                const content = delta.content || delta.delta.content;
                if (typeof content === 'string') {
                  assistantAnswer += content;
                }
              }
            } catch (e) {
              // Skip unparseable data
            }
          }
          
          // Continue reading
          processStream();
        } catch (error) {
          console.error('Error processing stream chunk:', error);
          // Try to continue despite errors
          processStream();
        }
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
      // Remove oldest entries
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
      
      if (endpointType === 'chatCompletion') {
        // For streaming responses
        if (isStreaming) {
          // Send initial metadata
          sendToExtension('chatCompletion', {
            url,
            requestBody,
            method: init?.method || 'GET',
            isStreaming: true
          });
          
          // Process the stream
          processStreamingResponse(response, url, requestBody);
        } else {
          // For non-streaming, clone and process asynchronously
          response.clone().json().then(data => {
            sendToExtension('chatCompletion', {
              url,
              requestBody,
              responseBody: data,
              method: init?.method || 'GET',
              isStreaming: false
            });
          }).catch(e => {
            // Silent fail for JSON parsing
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
      // Error in processing - log but don't block response
      console.error('Error processing intercepted fetch:', error);
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
    
    // Skip if not an endpoint we care about or already processed
    if (!endpointType || processedRequests.has(requestId)) {
      return originalXHRSend.apply(this, arguments);
    }
    
    processedRequests.add(requestId);
    
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
    
    // Call original send
    return originalXHRSend.apply(this, arguments);
  };
  
  // Notify that injection is complete
  sendToExtension('injectionComplete', { status: 'success' });
})();