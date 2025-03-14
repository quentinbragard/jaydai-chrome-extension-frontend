// src/content/injectedInterceptor.js
// Streamlined network interceptor

(function() {
  // Store original fetch method
  const originalFetch = window.fetch;
  
  // Define endpoints of interest
  const ENDPOINTS = {
    USER_INFO: '/backend-api/me',
    CONVERSATIONS_LIST: '/backend-api/conversations',
    CHAT_COMPLETION: '/backend-api/conversation',
    SPECIFIC_CONVERSATION: /\/backend-api\/conversation\/([a-f0-9-]+)$/
  };
  
  // Determine endpoint type from URL
  function getEndpointType(url) {
    if (!url) return null;
    
    const pathname = url.startsWith('http') 
      ? new URL(url).pathname 
      : url.split('?')[0];
    
    if (ENDPOINTS.SPECIFIC_CONVERSATION.test(pathname)) {
      return 'specificConversation';
    }
    if (pathname === ENDPOINTS.USER_INFO) return 'userInfo';
    if (pathname.startsWith(ENDPOINTS.CONVERSATIONS_LIST)) return 'conversationList';
    if (pathname.startsWith(ENDPOINTS.CHAT_COMPLETION)) return 'chatCompletion';
    
    return null;
  }
  
  // Send intercepted data to extension
  function sendToExtension(type, data) {
    document.dispatchEvent(new CustomEvent('archimind-network-intercept', {
      detail: { type, data, timestamp: Date.now() }
    }));
  }
  
  // Process streaming responses from ChatGPT
  async function processStreamingResponse(response, requestBody) {
    console.log("PROCESSING STREAMING RESPONSE")
    const clonedResponse = response.clone();
    const reader = clonedResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    // Data for current assistant response
    const assistantData = {
      messageId: null,
      conversationId: null,
      model: null,
      content: '',
      isComplete: false
    };
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete events
        let eventEndIndex;
        while ((eventEndIndex = buffer.indexOf('\n\n')) !== -1) {
          const eventString = buffer.substring(0, eventEndIndex + 2);
          buffer = buffer.substring(eventEndIndex + 2);
          
          // Parse event
          const eventMatch = eventString.match(/^event: ([^\n]+)/);
          const dataMatch = eventString.match(/data: (.+)$/m);
          console.log('🔑🔑 dataMatch', dataMatch);
          
          if (!dataMatch) continue;
          
          const eventType = eventMatch ? eventMatch[1] : 'unknown';
          
          // Skip [DONE] marker
          if (dataMatch[1].trim() === '[DONE]') {
            if (assistantData.messageId) {
              assistantData.isComplete = true;
              console.log("STOOOOOOOOOOOP")
              sendToExtension('assistantResponse', assistantData);
            }
            break;
          }
          
          // Parse JSON data
          try {
            const data = JSON.parse(dataMatch[1]);
            
            // Handle different event types
            if (eventType === 'delta') {
              // Handle message creation
              if (data.o === 'add' && data.v?.message?.author?.role === 'assistant') {
                assistantData.messageId = data.v.message.id;
                assistantData.conversationId = data.v.conversation_id;
                assistantData.model = data.v.message.metadata?.model_slug || null;
              }
              
              // Handle content appending
              if (data.p === '/message/content/parts/0' && data.o === 'append') {
                assistantData.content += data.v;
              }
              
            }
          } catch (error) {
            console.error('Error parsing data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error processing stream:', error);
    }
  }

  // Override fetch to intercept network requests
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const endpointType = getEndpointType(url);
    
    // Skip irrelevant endpoints
    if (!endpointType) {
      return originalFetch.apply(this, arguments);
    }
    
    // Extract request body
    let requestBody = null;
    if (init && init.body) {
      try {
        const bodyText = typeof init.body === 'string' 
          ? init.body 
          : new TextDecoder().decode(init.body);
          
        if (bodyText.trim().startsWith('{')) {
          requestBody = JSON.parse(bodyText);
        }
      } catch (e) {
        // Silent fail on parse errors
      }
    }
    
    // Call original fetch
    const response = await originalFetch.apply(this, arguments);
    
    // Skip non-successful responses
    if (!response.ok) return response;
    
    try {
      const isStreaming = response.headers.get('content-type')?.includes('text/event-stream') || false;
      
      if (endpointType === 'chatCompletion') {
        // Send request info
        sendToExtension('chatCompletion', { requestBody });
        
        // Process streaming responses
        if (isStreaming && requestBody?.messages?.[0]?.author?.role === "user") {
          processStreamingResponse(response, requestBody);
        }
      } 
      else if (!isStreaming) {
        // For non-streaming endpoints, clone and process response
        const responseData = await response.clone().json().catch(() => null);
        if (responseData) {
          sendToExtension(endpointType, {
            url,
            requestBody,
            responseBody: responseData,
            method: init?.method || 'GET'
          });
        }
      }
    } catch (error) {
      console.error('Error in fetch interceptor:', error);
    }
    
    return response;
  };
  
  // Notify that injection is complete
  sendToExtension('injectionComplete', { status: 'success' });
})();