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
 * Initialize the fetch interceptor by overriding the global fetch method
 */
export function initFetchInterceptor() {
  // Store original fetch method
  originalFetch = window.fetch;
  
  // Override fetch to intercept network requests
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    console.log('🔍 Intercepting request:', url);
    const eventName = getEndpointEvent(url);
    const platform = detectPlatform();
    // Skip irrelevant endpoints
    if (!eventName) {
      return originalFetch.apply(this, arguments);
    }
    
    // Extract request body
    const requestBody = extractRequestBody(init);
    
    
    // Call original fetch
    const response = await originalFetch.apply(this, arguments);
    
    // Skip non-successful responses
    if (!response.ok) return response;
    
    try {
      let isStreaming = response.headers.get('content-type')?.includes('text/event-stream') || false;
      // Mistral chat completions stream data but don't set the SSE header
      if (!isStreaming && platform === 'mistral' && eventName === EVENTS.CHAT_COMPLETION) {
        isStreaming = true;
      }
      
      if (eventName === EVENTS.CHAT_COMPLETION) {
        // Dispatch chat completion event
        dispatchEvent(EVENTS.CHAT_COMPLETION, platform, { requestBody });
        
        
        // Process streaming responses
        if (isStreaming) {
          // For streaming responses (used by ChatGPT and Mistral)
          processStreamingResponse(response, requestBody);
        } else {
          // Non streaming response, parse JSON and dispatch as assistant response
          const responseData = await response.clone().json().catch(() => null);
          if (responseData) {
            dispatchEvent(EVENTS.ASSISTANT_RESPONSE, platform, responseData);
          }
        }
      } else if (!isStreaming) {
        // For non-streaming endpoints, clone and process response
        const responseData = await response.clone().json().catch(() => null);
        if (responseData) {
          // Dispatch specialized event
          dispatchEvent(eventName, platform, {
            url,
            platform,
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