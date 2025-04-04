// src/extension/content/injectedInterceptor.js
// Updated to capture create_time and parent_message_provider_id

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
    console.log('getEndpointType-----------', pathname);
    
    if (ENDPOINTS.SPECIFIC_CONVERSATION.test(pathname)) {
      return 'specificConversation';
    }
    if (pathname === ENDPOINTS.USER_INFO) return 'userInfo';
    if (pathname.startsWith(ENDPOINTS.CONVERSATIONS_LIST))
      {
        console.log('==============conversationList', pathname);
        return 'conversationList';
      }
    if (pathname.startsWith(ENDPOINTS.CHAT_COMPLETION)) return 'chatCompletion';
    
    return null;
  }
  
  // Send intercepted data to extension
  function sendToExtension(type, data) {
    if (type === 'conversationList') {
      console.log('🚀🚀🚀🚀🚀 conversationList', data);
      document.dispatchEvent(new CustomEvent('archimind:conversation-list', {
        detail: { type, data, timestamp: Date.now() }
      }));
    }
    else {
      document.dispatchEvent(new CustomEvent('archimind-network-intercept', {
        detail: { type, data, timestamp: Date.now() }
      }));
    }
  }

  /**
   * Process streaming data from ChatGPT and organize into thinking steps
   * Updated to handle create_time and parent_message_provider_id
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
        currentThinkingStep: null,
        createTime: null,        // Added for timestamp
        parentMessageId: null    // Added for parent message tracking
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
      
      // Extract create_time if available
      if (data.v.message.create_time) {
        assistantData.createTime = data.v.message.create_time;
      }
      
      // Extract parent_message_provider_id if available in metadata
      if (data.v.message.metadata?.parent_id) {
        assistantData.parentMessageId = data.v.message.metadata.parent_id;
      }
      
      // Check if this is a thinking step (tool) or the final answer (assistant)
      const role = data.v.message.author?.role;
      
      // Create a new thinking step entry
      const newStep = {
        id: data.v.message.id,
        role: role,
        content: '',
        createTime: data.v.message.create_time,
        parentMessageId: data.v.message.metadata?.parent_id,
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
    
    // The rest of the function remains the same...
    // Existing content handling code
    
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
    
    // Handle patch operations
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
    console.log("PROCESSING STREAMING RESPONSE");
    const clonedResponse = response.clone();
    const reader = clonedResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    // Data for current assistant response
    let assistantData = {
      messageId: null,
      conversationId: null,
      model: null,
      content: '',
      isComplete: false,
      createTime: null,        // For timestamp
      parentMessageId: null    // For parent message tracking
    };
    
    // Array to track thinking steps
    let thinkingSteps = [];
    
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
  
          // Handle special "[DONE]" message 
          if (dataMatch[1] === '[DONE]') {
            console.log("Received [DONE] message, finalizing response");
            if (assistantData.messageId && assistantData.content.length > 0) {
              assistantData.isComplete = true;
              sendToExtension('assistantResponse', assistantData);
            }
            continue; // Skip JSON parsing for this message
          }
          
          // Parse JSON data (only for non-[DONE] messages)
          try {
            const data = JSON.parse(dataMatch[1]);
            
            // Process message stream complete event
            if (data.type === "message_stream_complete") {
              if (assistantData.messageId) {
                assistantData.isComplete = true;
                console.log("Stream processing complete");
                sendToExtension('assistantResponse', assistantData);
              }
              continue;
            }
            
            // Process the data using our specialized function
            const result = processStreamData(data, assistantData, thinkingSteps);
            assistantData = result.assistantData;
            thinkingSteps = result.thinkingSteps;
            
            // If the assistant is the final answer and we've accumulated significant content,
            // send periodic updates for long responses
            if (assistantData.messageId && 
                assistantData.content.length > 0 && 
                assistantData.content.length % 500 === 0) {
              // Send interim update with isComplete=false
              sendToExtension('assistantResponse', {
                ...assistantData,
                isComplete: false
              });
            }
          } catch (error) {
            console.error('Error parsing data:', error, 'Raw data:', dataMatch[1]);
          }
        }
      }
      
      // Final check: If we have message content but never got a completion signal,
      // send what we have with isComplete=true
      if (assistantData.messageId && assistantData.content.length > 0 && !assistantData.isComplete) {
        console.log("Stream ended without completion signal, sending final data");
        assistantData.isComplete = true;
        sendToExtension('assistantResponse', assistantData);
      }
    } catch (error) {
      console.error('Error processing stream:', error);
      
      // Try to salvage partial response in case of errors
      if (assistantData.messageId && assistantData.content.length > 0) {
        console.log("Salvaging partial response after error");
        assistantData.isComplete = true;
        sendToExtension('assistantResponse', assistantData);
      }
    }
  }
  
  // Override fetch to intercept network requests
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const endpointType = getEndpointType(url);
    
    // Skip irrelevant endpoints
    if (!endpointType) {
      console.log('-------------------kip irrelevant endpoints', url);
      return originalFetch.apply(this, arguments);
    }
    
    // Extract request body
    let requestBody = null;
    console.log('☺️ init', init);
    console.log('☺️ init.body', init.body);
    if (init) {
      try {
        if (init.body) {
          const bodyText = typeof init.body === 'string' 
            ? init.body 
            : new TextDecoder().decode(init.body);
            
        if (bodyText.trim().startsWith('{')) {
          requestBody = JSON.parse(bodyText);
          console.log('☺️ requestBody', requestBody);
          
          // Additional logging for parent_message_provider_id if present
          if (requestBody.parent_message_provider_id) {
            console.log('🔗 Parent message ID detected:', requestBody.parent_message_provider_id);
            }
          }
        }
      } catch (e) {
        // Silent fail on parse errors
      }
    }
    console.log('☺️☺️☺️☺️☺️☺️☺️☺️☺️', arguments );
    
    // Call original fetch
    const response = await originalFetch.apply(this, arguments);
    console.log("*************************8")
    console.log('☺️☺️☺️ response', response);
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