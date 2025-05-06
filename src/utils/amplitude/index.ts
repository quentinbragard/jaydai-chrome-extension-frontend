// src/utils/amplitude/index.ts
import * as amplitude from '@amplitude/analytics-browser';

/**
 * Initialize Amplitude with the API key and user ID (if available)
 * @param userId Optional user ID to identify the user
 */
export const initAmplitude = (userId?: string) => {
  amplitude.init('857a9c3b48322cbc7802683533e50155', {
    // Enable autocapture for automatic event tracking
    autocapture: {
      elementInteractions: true
    }
  });
  
  // Set user ID if provided
  if (userId) {
    amplitude.setUserId(userId);
  }
};

/**
 * Update the user ID for amplitude tracking
 * @param userId User ID to identify the user
 */
export const setAmplitudeUserId = (userId: string) => {
  if (userId) {
    amplitude.setUserId(userId);
  }
};

/**
 * Track a specific event with optional properties
 * @param eventName Name of the event to track
 * @param eventProperties Optional properties to include with the event
 */
export const trackEvent = (eventName: string, eventProperties = {}) => {
  amplitude.track(eventName, eventProperties);
};

/**
 * Predefined events for the extension
 */
export const EVENTS = {
  // Extension lifecycle events
  EXTENSION_INSTALLED: 'Extension Installed',
  EXTENSION_OPENED: 'Extension Opened',
  BUTTON_INJECTED: 'Button Injected',
  BUTTON_CLICKED: 'Button Clicked',
  MAIN_BUTTON_CLICKED: 'Main Button Clicked',
  
  // Authentication events
  SIGNIN_STARTED: 'Sign In Started',
  SIGNIN_COMPLETED: 'Sign In Completed',
  SIGNIN_FAILED: 'Sign In Failed',
  SIGNUP_STARTED: 'Sign Up Started',
  SIGNUP_COMPLETED: 'Sign Up Completed',
  SIGNUP_FAILED: 'Sign Up Failed',
  GOOGLE_AUTH_STARTED: 'Google Auth Started',
  GOOGLE_AUTH_COMPLETED: 'Google Auth Completed',
  GOOGLE_AUTH_FAILED: 'Google Auth Failed',
  SIGNOUT: 'Sign Out',
  
  // Onboarding events
  ONBOARDING_STARTED: 'Onboarding Started',
  ONBOARDING_STEP_VIEWED: 'Onboarding Step Viewed',
  ONBOARDING_STEP_COMPLETED: 'Onboarding Step Completed',
  ONBOARDING_COMPLETED: 'Onboarding Completed',
  ONBOARDING_SKIPPED: 'Onboarding Skipped',
  ONBOARDING_ERROR: 'Onboarding Error',
  ONBOARDING_GOTO_CHATGPT: 'Onboarding Go To ChatGPT',
  
  // Template events
  TEMPLATE_VIEWED: 'Template Viewed',
  TEMPLATE_SELECTED: 'Template Selected',
  TEMPLATE_MODIFIED: 'Template Modified',
  TEMPLATE_APPLIED: 'Template Applied',
  TEMPLATE_FOLDER_OPENED: 'Template Folder Opened',
  TEMPLATE_SEARCH: 'Template Search',
  
  // Settings events
  SETTINGS_OPENED: 'Settings Opened',
  SETTINGS_CHANGED: 'Settings Changed',
  
  // Network interceptor events
  NETWORK_INTERCEPTOR_STARTED: 'Network Interceptor Started',
  NETWORK_INTERCEPTOR_CAPTURED: 'Network Interceptor Captured',
  NETWORK_INTERCEPTOR_ERROR: 'Network Interceptor Error',
  
  // Usage statistics events
  USAGE_STATISTICS_VIEWED: 'Usage Statistics Viewed',
  CONVERSATION_CAPTURED: 'Conversation Captured',
  CONVERSATION_ANALYZED: 'Conversation Analyzed',
};

/**
 * Set user properties to track
 * @param properties User properties to track
 */
export const setUserProperties = (properties: Record<string, any>) => {
  // Create a new Identify object
  const identify = new amplitude.Identify();
  
  // Set each property individually
  Object.entries(properties).forEach(([key, value]) => {
    identify.set(key, value);
  });
  
  // Apply the identify operation
  amplitude.identify(identify);
};

/**
 * Track page/view events
 * @param pageName Name of the page being viewed
 */
export const trackPageView = (pageName: string) => {
  amplitude.track('Page Viewed', { page_name: pageName });
};