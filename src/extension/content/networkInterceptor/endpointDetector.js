// src/extension/content/networkInterceptor/endpointDetector.js
// Utilities for detecting and classifying endpoints

import { ENDPOINTS, EVENTS } from './constants';
import { detectPlatform } from './detectPlatform';

/**
 * More robust endpoint matching that works with both string and regex patterns
 * @param {string} url - The URL to check
 * @param {string|RegExp} pattern - The pattern to match against
 * @returns {boolean} - Whether the URL matches the pattern
 */
function matchEndpoint(url, pattern) {
  // If pattern is a RegExp object, test the URL with it
  if (pattern instanceof RegExp) {
    return pattern.test(url);
  }
  // If pattern is a string, check if the URL includes the pattern
  return url.includes(pattern);
}

/**
 * Determines the event to dispatch based on a URL
 * @param {string} url - The URL to analyze
 * @returns {string|null} - The event name to dispatch or null if not recognized
 */
export function getEndpointEvent(url) {
  if (!url) return null;
  const platform = detectPlatform();
  if (platform === 'unknown') return null;
  
  // Extract pathname from full URL or relative path
  const pathname = url.startsWith('http') 
    ? new URL(url).pathname + (new URL(url).search || '')  // Include query string
    : url;
  
  console.log(`Checking endpoint for ${platform}: ${pathname}`);
  
  // Use matchEndpoint for all endpoint checks
  if (matchEndpoint(pathname, ENDPOINTS[platform].SPECIFIC_CONVERSATION)) {
    console.log(`Matched ${platform} SPECIFIC_CONVERSATION`);
    return EVENTS.SPECIFIC_CONVERSATION;
  }
  
  if (matchEndpoint(pathname, ENDPOINTS[platform].USER_INFO)) {
    console.log(`Matched ${platform} USER_INFO`);
    return EVENTS.USER_INFO;
  }
  
  if (matchEndpoint(pathname, ENDPOINTS[platform].CONVERSATIONS_LIST)) {
    console.log(`Matched ${platform} CONVERSATIONS_LIST`);
    return EVENTS.CONVERSATIONS_LIST;
  }
  
  if (matchEndpoint(pathname, ENDPOINTS[platform].CHAT_COMPLETION)) {
    console.log(`Matched ${platform} CHAT_COMPLETION`);
    return EVENTS.CHAT_COMPLETION;
  }
  
  console.log(`No match found for ${platform}: ${pathname}`);
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