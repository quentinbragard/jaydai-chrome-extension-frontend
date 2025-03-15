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

  /**
 * Process streaming data from ChatGPT and organize into thinking steps
 * @param {object} data - The individual data packet from the stream
 * @param {object} assistantData - The object tracking the current response 
 * @param {array} thinkingSteps - Array of thinking steps being built
 * @returns {object} Updated assistantData including any changes
 */
function processStreamData(data, assistantData, thinkingSteps) {
  // Initialize assistantData if needed
  if (!assistantData) {
    assistantData = {
      messageId: null,
      conversationId: null,
      model: null,
      content: '',
      isComplete: false,
      currentThinkingStep: null
    };
  }
  
  // Initialize thinkingSteps if needed
  if (!thinkingSteps) {
    thinkingSteps = [];
  }

  // Handle message stream complete marker
  if (data.type === "message_stream_complete") {
    assistantData.isComplete = true;
    assistantData.conversationId = data.conversation_id || assistantData.conversationId;
    return { assistantData, thinkingSteps };
  }
  
  // Handle initial message creation with 'add' operation
  if (data.o === "add" && data.v?.message) {
    // Extract message metadata
    assistantData.messageId = data.v.message.id;
    assistantData.conversationId = data.v.conversation_id;
    assistantData.model = data.v.message.metadata?.model_slug || null;
    
    // Check if this is a thinking step (tool) or the final answer (assistant)
    const role = data.v.message.author?.role;
    
    // Create a new thinking step entry
    const newStep = {
      id: data.v.message.id,
      role: role,
      content: '',
      initialText: data.v.message.metadata?.initial_text || '',
      finishedText: data.v.message.metadata?.finished_text || ''
    };
    
    thinkingSteps.push(newStep);
    assistantData.currentThinkingStep = thinkingSteps.length - 1;
    
    // If this is the assistant's final message, set it as the main content
    if (role === 'assistant') {
      assistantData.content = '';
    }
    
    return { assistantData, thinkingSteps };
  }
  
  // Handle content appending with explicit path
  if (data.o === "append" && data.p === "/message/content/parts/0" && data.v) {
    // If we have a current thinking step, append to it
    if (assistantData.currentThinkingStep !== null && assistantData.currentThinkingStep < thinkingSteps.length) {
      thinkingSteps[assistantData.currentThinkingStep].content += data.v;
      
      // If this is the assistant's message, also update the main content
      if (thinkingSteps[assistantData.currentThinkingStep].role === 'assistant') {
        assistantData.content += data.v;
      }
    }
    return { assistantData, thinkingSteps };
  }
  
  // Handle simple string append (when data.v is a string with no operation)
  if (typeof data.v === "string" && !data.o) {
    // If we have a current thinking step, append to it
    if (assistantData.currentThinkingStep !== null && assistantData.currentThinkingStep < thinkingSteps.length) {
      thinkingSteps[assistantData.currentThinkingStep].content += data.v;
      
      // If this is the assistant's message, also update the main content
      if (thinkingSteps[assistantData.currentThinkingStep].role === 'assistant') {
        assistantData.content += data.v;
      }
    }
    return { assistantData, thinkingSteps };
  }
  
  // Handle patch operations that include status updates or metadata changes
  if (data.o === "patch" && Array.isArray(data.v)) {
    for (const patch of data.v) {
      // Check for status changes
      if (patch.p === "/message/status" && patch.v === "finished_successfully") {
        // The current thinking step is complete, but the overall message may not be
      }
      
      // Check for metadata changes
      if (patch.p === "/message/metadata/finished_text" && assistantData.currentThinkingStep !== null) {
        // Update the finished text for the current thinking step
        thinkingSteps[assistantData.currentThinkingStep].finishedText = patch.v;
      }
      
      // Check for content append in a patch
      if (patch.p === "/message/content/parts/0" && patch.o === "append" && patch.v) {
        if (assistantData.currentThinkingStep !== null && assistantData.currentThinkingStep < thinkingSteps.length) {
          thinkingSteps[assistantData.currentThinkingStep].content += patch.v;
          
          // If this is the assistant's message, also update the main content
          if (thinkingSteps[assistantData.currentThinkingStep].role === 'assistant') {
            assistantData.content += patch.v;
          }
        }
      }
    }
    return { assistantData, thinkingSteps };
  }
  
  // Return current state unchanged for any unhandled data format
  return { assistantData, thinkingSteps };
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
          
          if (!dataMatch) continue;
          
          const eventType = eventMatch ? eventMatch[1] : 'unknown';
          
         
          
          // Parse JSON data
          try {
            const data = JSON.parse(dataMatch[1]);
            console.log('🔑🔑 data', data);
            console.log('🔑🔑 eventType', eventType);

            // Handle different data types

            if (data.type === "message_stream_complete") {
              if (assistantData.messageId) {
                assistantData.isComplete = true;
                console.log("STOOOOOOOOOOOP")
                sendToExtension('assistantResponse', assistantData);
              }
              break;
            }

            if(typeof data.v === "string") {
            
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