// src/extension/content/injectedInterceptor/endpointDetector.js
// Utilities for detecting and classifying endpoints

import { ENDPOINTS, DATA_TYPES } from './constants';

/**
 * Determines the type of endpoint from a URL
 * @param {string} url - The URL to analyze
 * @returns {string|null} - The endpoint type or null if not recognized
 */
export function getEndpointType(url) {
  if (!url) return null;
  
  // Extract pathname from full URL or relative path
  const pathname = url.startsWith('http') 
    ? new URL(url).pathname 
    : url.split('?')[0];
  
  // Match against known endpoints
  if (ENDPOINTS.SPECIFIC_CONVERSATION.test(pathname)) {
    return DATA_TYPES.SPECIFIC_CONVERSATION;
  }
  
  if (pathname === ENDPOINTS.USER_INFO) {
    return DATA_TYPES.USER_INFO;
  }
  
  if (pathname.startsWith(ENDPOINTS.CONVERSATIONS_LIST)) {
    return DATA_TYPES.CONVERSATIONS_LIST;
  }
  
  if (pathname.startsWith(ENDPOINTS.CHAT_COMPLETION)) {
    return DATA_TYPES.CHAT_COMPLETION;
  }
  
  return null;
}

/**
 * Extracts request body data from fetch init parameter
 * @param {Object} init - The init parameter from fetch
 * @returns {Object|null} - Parsed body or null if not parseable
 */
export function extractRequestBody(init) {
  if (!init || !init.body) return null;
  
  try {
    const bodyText = typeof init.body === 'string' 
      ? init.body 
      : new TextDecoder().decode(init.body);
        
    if (bodyText.trim().startsWith('{')) {
      return JSON.parse(bodyText);
    }
  } catch (e) {
    // Silent fail on parse errors
    console.error('Error parsing request body:', e);
  }
  
  return null;
}