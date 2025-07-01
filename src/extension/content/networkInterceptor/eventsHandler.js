// src/extension/content/injectedInterceptor/eventsHandler.js
// Utilities for dispatching events to the extension

import { EVENTS } from './constants';

/**
 * Dispatches an event to the extension with the appropriate event type
 * @param {string} eventName - The name of the event to dispatch
 * @param {Object} data - The data to include in the event detail
 */
export function dispatchEvent(eventName, platform, data) {
  document.dispatchEvent(new CustomEvent(eventName, {
    detail: { ...data, platform, timestamp: Date.now() }
  }));
}