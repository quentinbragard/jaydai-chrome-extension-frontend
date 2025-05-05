// src/utils/analytics.js
import * as amplitude from '@amplitude/analytics-browser';

// Initialize Amplitude with your API key
export const initAmplitude = () => {
  amplitude.init('857a9c3b48322cbc7802683533e50155', {
    // Enable autocapture for automatic event tracking
    autocapture: {
      elementInteractions: true
    }
  });
};

// Track specific events with optional properties
export const trackEvent = (eventName, eventProperties = {}) => {
  amplitude.track(eventName, eventProperties);
};

// Predefined events for your extension
export const EVENTS = {
  EXTENSION_INSTALLED: 'Extension Installed',
  MAIN_BUTTON_CLICKED: 'Main Button Clicked',
  EXTENSION_OPENED: 'Extension Opened',
  BUTTON_INJECTED: 'Button Injected',
  BUTTON_CLICKED: 'Button Clicked',
  TEMPLATE_VIEWED: 'Template Viewed',
  TEMPLATE_SELECTED: 'Template Selected',
  TEMPLATE_MODIFIED: 'Template Modified',
  TEMPLATE_APPLIED: 'Template Applied',
  SETTINGS_OPENED: 'Settings Opened',
  SETTINGS_CHANGED: 'Settings Changed',
};

// User properties to track - using identify instead of setUserProperties
export const setUserProperties = (properties) => {
  // Create a new Identify object
  const identify = new amplitude.Identify();
  
  // Set each property individually
  Object.entries(properties).forEach(([key, value]) => {
    identify.set(key, value);
  });
  
  // Apply the identify operation
  amplitude.identify(identify);
};

// Track page/view events
export const trackPageView = (pageName) => {
  amplitude.track('Page Viewed', { page_name: pageName });
};