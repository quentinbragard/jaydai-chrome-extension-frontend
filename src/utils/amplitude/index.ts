// src/utils/amplitude/index.ts
import * as amplitude from '@amplitude/analytics-browser';
import { detectPlatform } from '@/platforms/platformManager';

/**
 * Initialize Amplitude with the API key and user ID (if available)
 * @param userId Optional user ID to identify the user
 */
export const initAmplitude = (userId?: string, autoCapture = true) => {
  const apiKey = process.env.VITE_AMPLITUDE_API_KEY;
  console.log('Amplitude API key:', apiKey);

  if (!apiKey) {
    console.error('Amplitude API key is not defined.');
    return;
  }

  amplitude.init(apiKey, {
    // Enable autocapture for automatic event tracking
    autocapture: {
      elementInteractions: autoCapture
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
  const platform = detectPlatform();
  amplitude.track(eventName, { ...eventProperties, 'ai_platform': platform });
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

  // Menu events
  MENU_ITEM_CLICKED: 'Menu Item Clicked',

  // Template events
  TEMPLATE_USE: 'Template Used',
  TEMPLATE_USE_ERROR: 'Template Use Error',
  
  // Onboarding events
  ONBOARDING_STARTED: 'Onboarding Started',
  ONBOARDING_STEP_VIEWED: 'Onboarding Step Viewed',
  ONBOARDING_STEP_COMPLETED: 'Onboarding Step Completed',
  ONBOARDING_COMPLETED: 'Onboarding Completed',
  ONBOARDING_SKIPPED: 'Onboarding Skipped',
  ONBOARDING_ERROR: 'Onboarding Error',
  ONBOARDING_GOTO_AI_TOOL: 'Onboarding Go To AI Tool',

  POPUP_OPENED: 'Popup Opened',
  
  // Template events
  TEMPLATE_VIEWED: 'Template Viewed',
  TEMPLATE_SELECTED: 'Template Selected',
  TEMPLATE_MODIFIED: 'Template Modified',
  TEMPLATE_USED: 'Template Used',
  TEMPLATE_USED_ERROR: 'Template Use Error',
  TEMPLATE_FOLDER_OPENED: 'Template Folder Opened',
  TEMPLATE_SEARCH: 'Template Search',
  TEMPLATE_CREATE: 'Template Created',
  TEMPLATE_CREATE_ERROR: 'Template Create Error',
  TEMPLATE_DELETE: 'Template Deleted',
  TEMPLATE_DELETE_FOLDER: 'Template Folder Deleted',
  TEMPLATE_EDIT: 'Template Edited',
  TEMPLATE_PINNED: 'Template Pinned',
  TEMPLATE_UNPINNED: 'Template Unpinned',
  FOLDER_PINNED: 'Folder Pinned',
  FOLDER_UNPINNED: 'Folder Unpinned',
  TEMPLATE_BROWSE_OFFICIAL: 'Template Browse Official',
  TEMPLATE_BROWSE_ORGANIZATION: 'Template Browse Organization',
  ENTERPRISE_LIBRARY_ACCESSED: 'Enterprise Library Accessed',
  ENTERPRISE_CTA_CLICKED: 'Enterprise CTA Clicked',
  TEMPLATE_REFRESH: 'Template Refresh',
  TEMPLATE_FOLDER_CREATED: 'Template Folder Created',
  TEMPLATE_EDIT_DIALOG_OPENED: 'Template Edit Dialog Opened',
  TEMPLATE_EDITOR_DIALOG_OPENED: 'Template Editor Dialog Opened',
  TEMPLATE_DIALOG_VIEW_CHANGED: 'Template Dialog View Changed',

  BLOCK_CREATED: 'Block Created',
  BLOCK_DELETED: 'Block Deleted',
  BLOCK_UPDATED: 'Block Updated',
  INSERT_BLOCK_DIALOG_OPENED: 'Insert Block Dialog Opened',
  INSERT_BLOCK_DIALOG_CLOSED: 'Insert Block Dialog Closed',
  INSERT_BLOCK_DIALOG_BLOCK_SELECTED: 'Insert Block Dialog Block Selected',
  INSERT_BLOCK_DIALOG_BLOCK_UNSELECTED: 'Insert Block Dialog Block Unselected',
  INSERT_BLOCK_DIALOG_BLOCK_DELETED: 'Insert Block Dialog Block Deleted',
  INSERT_BLOCK_DIALOG_BLOCK_UPDATED: 'Insert Block Dialog Block Updated',
  INSERT_BLOCK_DIALOG_BLOCKS_INSERTED: 'Insert Block Dialog Blocks Inserted',

  QUICK_BLOCK_SELECTOR_OPENED: 'Quick Block Selector Opened',
  QUICK_BLOCK_SELECTOR_CLOSED: 'Quick Block Selector Closed',
  QUICK_BLOCK_SELECTOR_BLOCKS_INSERTED: 'Quick Block Selector Blocks Inserted',

  // Tutorial events
  TUTORIALS_LIST_OPENED: 'Tutorials List Opened',
  TUTORIALS_LIST_CLOSED: 'Tutorials List Closed',
  TUTORIAL_VIDEO_PLAYED: 'Tutorial Video Played',

  // Notification events
  NOTIFICATIONS_PANEL_OPENED: 'Notifications Panel Opened',
  NOTIFICATION_ACTION_CLICKED: 'Notification Action Clicked',
  NOTIFICATION_MARKED_READ: 'Notification Marked Read',
  NOTIFICATION_MARK_ALL_READ: 'Notification Mark All Read',
  NOTIFICATION_DELETED: 'Notification Deleted',


  // Settings events
  SETTINGS_OPENED: 'Settings Opened',
  SETTINGS_CHANGED: 'Settings Changed',
  
  // Network interceptor events
  USER_MESSAGE_CAPTURED: 'User Message Captured',
  AI_ANSWER_CAPTURED: 'AI Answer Captured',
  CHAT_CONVERSATION_CHANGED: 'Chat Conversation Changed',
  
  // Usage statistics events
  USAGE_STATISTICS_VIEWED: 'Usage Statistics Viewed',
  CONVERSATION_CAPTURED: 'Conversation Captured',
  CONVERSATION_ANALYZED: 'Conversation Analyzed',
  ERROR_OCCURRED: 'Error Occurred',

  // Chat session events
  CHAT_SESSION_STARTED: 'Chat Session Started',
  CHAT_SESSION_ENDED: 'Chat Session Ended',
// Generic dialog events
  DIALOG_OPENED: 'Dialog Opened',
  DIALOG_CLOSED: 'Dialog Closed',

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
 * Increment a user property by a specified amount
 * @param property Name of the property to increment
 * @param value Amount to increment by (default: 1)
 */
export const incrementUserProperty = (property: string, value: number = 1) => {
  // Create a new Identify object
  const identify = new amplitude.Identify();
  
  // Use the add method to increment the property
  identify.add(property, value);
  
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