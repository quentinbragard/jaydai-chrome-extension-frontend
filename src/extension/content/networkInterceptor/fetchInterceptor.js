// src/extension/content/networkInterceptor/fetchInterceptor.js
// Core fetch override functionality

import { getEndpointEvent } from './endpointDetector';
import { extractRequestBody } from './endpointDetector';
import { dispatchEvent } from './eventsHandler';
import { processStreamingResponse } from './streamProcessor';
import { detectPlatform } from './detectPlatform';
import { EVENTS } from './constants';

/**
 * Store the original fetch method
 */
let originalFetch = null;

/**
 * Helper function to detect streaming responses more reliably
 */
function isStreamingResponse(response, requestInit, platform) {
  try {
    // Check response content-type
    const responseContentType = 
      response.headers.get('content-type') || 
      response.headers.get('Content-Type') || 
      response.headers.get('Content-type') || 
      '';
    
    // Check request content-type and other request headers
    let requestContentType = '';
    let requestAccept = '';
    
    if (requestInit && requestInit.headers) {
      const headers = requestInit.headers;
      
      if (headers instanceof Headers) {
        requestContentType = headers.get('content-type') || headers.get('Content-Type') || '';
        requestAccept = headers.get('accept') || headers.get('Accept') || '';
      } else if (typeof headers === 'object') {
        // Handle plain object headers
        requestContentType = headers['content-type'] || headers['Content-Type'] || '';
        requestAccept = headers['accept'] || headers['Accept'] || '';
      }
    }
    
    // Platform-specific streaming detection
    let isStreaming = false;
    
    if (platform === 'mistral') {
      // For Mistral, check if request asks for streaming
      isStreaming = 
        requestContentType.toLowerCase().includes('text/stream') ||
        requestAccept.toLowerCase().includes('text/event-stream') ||
        responseContentType.toLowerCase().includes('text/event-stream');
    } else {
      // For other platforms, primarily check response content-type
      isStreaming = responseContentType.toLowerCase().includes('text/event-stream');
    }
    
    return isStreaming;
  } catch (error) {
    console.warn('Error detecting streaming response:', error);
    return false;
  }
}

/**
 * Initialize the fetch interceptor by overriding the global fetch method
 */
export function initFetchInterceptor() {
  // Store original fetch method
  originalFetch = window.fetch;
  
  // Override fetch to intercept network requests
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    console.log('🌐 Intercepting fetch request:', url);
    
    const eventName = getEndpointEvent(url);
    const platform = detectPlatform();
    
    // Skip irrelevant endpoints
    if (!eventName) {
      console.log('⏭️ Skipping non-relevant endpoint:', url);
      return originalFetch.apply(this, arguments);
    }
    
    console.log('🎯 Relevant endpoint detected:', { url, eventName, platform });
    
    // Extract request body
    const requestBody = extractRequestBody(init) || {};
    
    // Call original fetch
    const response = await originalFetch.apply(this, arguments);
    
    // Skip non-successful responses but log them for debugging
    if (!response.ok) {
      console.warn('❌ Non-successful response:', response.status, response.statusText, url);
      return response;
    }
    
    console.log('✅ Successful response:', response.status, url);
    
    try {
      if (eventName === EVENTS.CHAT_COMPLETION) {
        console.log('💬 Processing chat completion event');
        
        // Dispatch chat completion event
        dispatchEvent(EVENTS.CHAT_COMPLETION, platform, { 
          requestBody, 
          url,
          method: init?.method || 'POST'
        });
        
        // Detect streaming more reliably
        const isStreaming = isStreamingResponse(response, init, platform);
        console.log('🌊 Is streaming response:', isStreaming);
        
        // Ensure parentMessageId is available for streaming processor
        if (requestBody) {
          requestBody['parentMessageId'] = requestBody.parent_message_id || requestBody.parentMessageId;
          requestBody['conversationId'] = requestBody.conversation_id || requestBody.conversationId;
        }
        
        if (isStreaming) {
          console.log('🔄 Processing streaming response');
          // Process streaming responses
          processStreamingResponse(response, requestBody);
        } else {
          console.log('📄 Processing non-streaming response');
          // Non streaming response, parse JSON and dispatch as assistant response
          try {
            const responseData = await response.clone().json();
            if (responseData) {
              console.log('📤 Dispatching assistant response:', responseData);
              dispatchEvent(EVENTS.ASSISTANT_RESPONSE, platform, responseData);
            }
          } catch (jsonError) {
            console.warn('Failed to parse response as JSON:', jsonError);
          }
        }
      } else {
        console.log('📋 Processing other endpoint event:', eventName);
        
        // For other endpoints, check if it's streaming
        const isStreaming = isStreamingResponse(response, init, platform);
        
        if (!isStreaming) {
          // For non-streaming endpoints, clone and process response
          try {
            const responseData = await response.clone().json();
            if (responseData) {
              console.log('📤 Dispatching endpoint event:', eventName, responseData);
              // Dispatch specialized event
              dispatchEvent(eventName, platform, {
                url,
                platform,
                requestBody,
                responseBody: responseData,
                method: init?.method || 'GET'
              });
            }
          } catch (jsonError) {
            console.warn('Failed to parse response as JSON for endpoint:', eventName, jsonError);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetch interceptor:', error);
    }
    
    return response;
  };
  
  console.log('✅ Fetch interceptor initialized successfully');
}

/**
 * Restore the original fetch method
 */
export function restoreFetch() {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
    console.log('🔄 Original fetch method restored');
  }
}