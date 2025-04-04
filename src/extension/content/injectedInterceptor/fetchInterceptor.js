// src/extension/content/injectedInterceptor/fetchInterceptor.js
// Core fetch override functionality

import { getEndpointType, extractRequestBody } from './endpointDetector';
import { sendToExtension } from './interceptedEventsHanlder';
import { processStreamingResponse } from './streamProcessor';
import { DATA_TYPES } from './constants';

/**
 * Store the original fetch method
 */
let originalFetch = null;

/**
 * Initialize the fetch interceptor by overriding the global fetch method
 */
export function initFetchInterceptor() {
  // Store original fetch method
  originalFetch = window.fetch;
  
  // Override fetch to intercept network requests
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const endpointType = getEndpointType(url);
    
    // Skip irrelevant endpoints
    if (!endpointType) {
      return originalFetch.apply(this, arguments);
    }
    
    // Extract request body
    const requestBody = extractRequestBody(init);
    
    // Log parent message ID if present (for debugging)
    if (requestBody?.parent_message_provider_id) {
      console.log('🔗 Parent message ID detected:', requestBody.parent_message_provider_id);
    }
    
    // Call original fetch
    const response = await originalFetch.apply(this, arguments);
    
    // Skip non-successful responses
    if (!response.ok) return response;
    
    try {
      const isStreaming = response.headers.get('content-type')?.includes('text/event-stream') || false;
      
      if (endpointType === DATA_TYPES.CHAT_COMPLETION) {
        // Send request info
        sendToExtension(DATA_TYPES.CHAT_COMPLETION, { requestBody });
        
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
}

/**
 * Restore the original fetch method
 */
export function restoreFetch() {
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
}