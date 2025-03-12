// src/content/injectedInterceptor.js
// Streamlined network interceptor

(function() {
  // Store original fetch method
  const originalFetch = window.fetch;
  
  // Define endpoints with simple paths
  const ENDPOINTS = {
    USER_INFO: '/backend-api/me',
    CONVERSATIONS_LIST: '/backend-api/conversations',
    CHAT_COMPLETION: '/backend-api/conversation',
    SPECIFIC_CONVERSATION: /\/backend-api\/conversation\/([a-f0-9-]+)$/
  };
  
  // Simple endpoint detection
  function getEndpointType(url) {
    if (!url) return null;
    
    const pathname = url.startsWith('http') 
      ? new URL(url).pathname 
      : url.split('?')[0];
    
    // Check endpoints in priority order
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
  
  // Efficient streaming response processor
  async function processStreamingResponse(response, requestBody) {
    // Clone response to avoid consuming the original
    const clonedResponse = response.clone();
    const reader = clonedResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    // Track assistant response data
    let assistantResponseData = {
      messageId: null,
      conversationId: null,
      createTime: null,
      model: null,
      content: '',
      isComplete: false
    };
    
    // Flag to track if we're currently processing an assistant response
    let isProcessingAssistantResponse = false;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const decodedValue = decoder.decode(value, { stream: true });
        buffer += decodedValue;
        
        // Process each complete event in the buffer
        let eventEndIndex;
        while ((eventEndIndex = buffer.indexOf('\n\n')) !== -1) {
          const eventString = buffer.substring(0, eventEndIndex + 2);
          buffer = buffer.substring(eventEndIndex + 2);
          
          const { event, eventData } = processDecodedValue(eventString);
          
          if (event && eventData) {
            console.log("event", event);
            console.log("eventData", eventData);
            console.log("--------------------------------");
            
            // Handle delta events
            if (event === 'delta') {
              // Handle different delta event types
              
              // Check if this is the start of an assistant response
              if (eventData.o === 'add' && 
                  eventData.v?.message?.author?.role === 'assistant') {
                isProcessingAssistantResponse = true;
                // Extract initial assistant data
                assistantResponseData = {
                  messageId: eventData.v.message.id,
                  conversationId: eventData.v.conversation_id,
                  createTime: eventData.v.message.create_time,
                  model: eventData.v.message.metadata?.model_slug || null,
                  content: '',
                  isComplete: false
                };
                console.log('Detected assistant response:', assistantResponseData);
              }
              
              // Only process content if we're tracking an assistant response
              if (isProcessingAssistantResponse) {
                // Accumulate content from append operations
                if (eventData.p === '/message/content/parts/0' && eventData.o === 'append') {
                  assistantResponseData.content += eventData.v;
                  console.log('Accumulated content:', assistantResponseData.content);
                } else if (eventData.v && typeof eventData.v === 'string' && !eventData.p) {
                  // Sometimes the content is directly in the v property
                  assistantResponseData.content += eventData.v;
                  console.log('Accumulated content (direct):', assistantResponseData.content);
                }
                
                // Check for completion markers
                if (eventData.o === 'patch' && Array.isArray(eventData.v)) {
                  const statusUpdate = eventData.v.find(patch => 
                    patch.p === '/message/status' && 
                    patch.v === 'finished_successfully'
                  );
                  
                  const endTurnUpdate = eventData.v.find(patch => 
                    patch.p === '/message/end_turn' && 
                    patch.v === true
                  );
                  
                  if (statusUpdate && endTurnUpdate) {
                    assistantResponseData.isComplete = true;
                    console.log('Assistant response complete:', assistantResponseData);
                    
                    // Send the complete assistant response data to extension
                    sendToExtension('assistantResponse', assistantResponseData);
                    
                    // Reset tracking
                    isProcessingAssistantResponse = false;
                  }
                }
              }
            } else if (event === 'delta_encoding') {
              // Handle version info or other metadata
              console.log('Delta encoding event:', eventData);
            }
          }
        }
        
        // If we have a complete response marker, send immediately
        if (buffer.includes('[DONE]')) {
          if (isProcessingAssistantResponse && assistantResponseData.messageId) {
            assistantResponseData.isComplete = true;
            console.log('Response complete via [DONE] marker:', assistantResponseData);
            sendToExtension('assistantResponse', assistantResponseData);
          }
          break;
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error);
    }
  }

  // Function to process event strings
  function processDecodedValue(valueString) {
    // Find the index of the keywords
    const eventIndex = valueString.indexOf("event: ");
    const dataIndex = valueString.indexOf("data: ");

    let event = null;
    let eventData = null;

    if (eventIndex !== -1 && dataIndex !== -1) {
      // Extract the event string
      event = valueString.substring(eventIndex + 7, dataIndex).trim();

      // Extract the data string
      const dataString = valueString.substring(dataIndex + 6).trim();

      // Attempt to parse the data string as JSON
      try {
        eventData = JSON.parse(dataString);
      } catch (e) {
        eventData = dataString; // Fallback to string if parsing fails
      }
    }

    return { event, eventData };
  }

  // Fetch override with focused functionality
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const endpointType = getEndpointType(url);
    
    // Skip processing for irrelevant endpoints
    if (!endpointType) {
      return originalFetch.apply(this, arguments);
    }
    
    // Extract request body if present
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
    
    // Skip processing for non-successful responses
    if (!response.ok) return response;
    
    // Process response based on type
    try {
      const isStreaming = response.headers.get('content-type')?.includes('text/event-stream') || false;
      
      if (endpointType === 'chatCompletion') {
        // Send the request info immediately
        sendToExtension('chatCompletion', { requestBody });
        
        // Process streaming content if applicable
        console.log('isStreaming', isStreaming);
        console.log('requestBody', requestBody);
        if (isStreaming && requestBody?.messages?.[0]?.author?.role === "user") {
          processStreamingResponse(response, requestBody);
        }
      } 
      else if (!isStreaming && (endpointType === 'specificConversation' || endpointType === 'conversationList')) {
        // For non-streaming endpoints that return JSON
        const data = await response.clone().json().catch(() => null);
        if (data) {
          sendToExtension(endpointType, {
            url,
            requestBody,
            responseBody: data,
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