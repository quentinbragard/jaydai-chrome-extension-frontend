// src/extension/content/injectedInterceptor/messageHandler.js
// Utilities for communicating with the extension

import { EVENTS, DATA_TYPES } from './constants';

/**
 * Sends intercepted data to the extension via a custom event
 * @param {string} type - The type of data being sent
 * @param {Object} data - The data to send
 */
export function sendToExtension(type, data) {
    // Standard handling for all other event types
    document.dispatchEvent(new CustomEvent(EVENTS.NETWORK_INTERCEPT, {
      detail: { type, data, timestamp: Date.now() }
    }));
  }
}

/**
 * Sends a notification that the interceptor has been successfully injected
 */
export function sendInjectionComplete() {
  sendToExtension(DATA_TYPES.INJECTION_COMPLETE, { status: 'success' });
}