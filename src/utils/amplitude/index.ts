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
  MAIN_BUTTON_DRAG_STARTED: 'Main Button Drag Started',
  MAIN_BUTTON_DRAG_ENDED: 'Main Button Drag Ended',
  
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

    // Payment & Subscription events
    PAYMENT_INITIATED: 'Payment Initiated',
    PAYMENT_COMPLETED: 'Payment Completed',
    PAYMENT_FAILED: 'Payment Failed',
    PAYMENT_CANCELLED: 'Payment Cancelled',
    SUBSCRIPTION_CREATED: 'Subscription Created',
    SUBSCRIPTION_UPDATED: 'Subscription Updated',
    SUBSCRIPTION_CANCELLED: 'Subscription Cancelled',
    SUBSCRIPTION_RENEWED: 'Subscription Renewed',
    
    // Onboarding payment specific
    ONBOARDING_PAYMENT_STEP_VIEWED: 'Onboarding Payment Step Viewed',
    ONBOARDING_PAYMENT_COMPLETED: 'Onboarding Payment Completed',
    ONBOARDING_PAYMENT_CANCELLED: 'Onboarding Payment Cancelled',
    ONBOARDING_PAYMENT_SKIPPED: 'Onboarding Payment Skipped',

  POPUP_OPENED: 'Popup Opened',
  POPUP_AI_TOOL_CLICKED: 'Popup AI Tool Clicked',

   // Settings panel events
   SETTINGS_PANEL_OPENED: 'settings_panel_opened',
   DATA_COLLECTION_TOGGLED: 'data_collection_toggled',
   MANAGE_SUBSCRIPTION_CLICKED: 'manage_subscription_clicked',
   EXTERNAL_LINK_CLICKED: 'external_link_clicked',
  
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
  TEMPLATE_RESET_PLACEHOLDERS: 'Template Reset Placeholders',
  TEMPLATE_TOGGLE_PREVIEW: 'Template Toggle Preview',
  TEMPLATE_DELETE: 'Template Deleted',
  TEMPLATE_DELETE_FOLDER: 'Template Folder Deleted',
  TEMPLATE_EDIT: 'Template Edited',
  TEMPLATE_FOLDER_EDIT: 'Template Folder Edited',
  TEMPLATE_FOLDER_DELETE: 'Template Folder Deleted',
  TEMPLATE_PINNED: 'Template Pinned',
  TEMPLATE_UNPINNED: 'Template Unpinned',
  FOLDER_PINNED: 'Folder Pinned',
  FOLDER_UNPINNED: 'Folder Unpinned',
  TEMPLATE_BROWSE_OFFICIAL: 'Template Browse Official',
  TEMPLATE_BROWSE_ORGANIZATION: 'Template Browse Organization',
  ENTERPRISE_LIBRARY_ACCESSED: 'Enterprise Library Accessed',
  ENTERPRISE_CTA_CLICKED: 'Enterprise CTA Clicked',
  ORGANIZATION_WEBSITE_CLICKED: 'Organization Website Clicked',
  TEMPLATE_REFRESH: 'Template Refresh',
  TEMPLATE_FOLDER_CREATED: 'Template Folder Created',
  TEMPLATE_DIALOG_VIEW_CHANGED: 'Template Dialog View Changed',

  COMPACT_METADATA_CARD_BLOCK_SELECTED: 'Compact Metadata Card Block Selected',
  COMPACT_METADATA_SECTION_RESTORE_ORIGINAL_METADATA: 'Compact Metadata Section Restore Original Metadata',

  BLOCK_CREATED: 'Block Created',
  BLOCK_DELETED: 'Block Deleted',
  BLOCK_UPDATED: 'Block Updated',

  INSERT_BLOCK_DIALOG_BLOCK_TYPE_FILTER_CHANGED: 'Insert Block Dialog Block Type Filter Changed',
  INSERT_BLOCK_DIALOG_BLOCK_SELECTED: 'Insert Block Dialog Block Selected',
  INSERT_BLOCK_DIALOG_BLOCK_UNSELECTED: 'Insert Block Dialog Block Unselected',
  INSERT_BLOCK_DIALOG_BLOCKS_INSERTED: 'Insert Block Dialog Blocks Inserted',
  INSERT_BLOCK_DIALOG_BLOCKS_COPIED_TO_CLIPBOARD: 'Insert Block Dialog Blocks Copied To Clipboard',
  INSERT_BLOCK_DIALOG_PREVIEW_MODE_CHANGED: 'Insert Block Dialog Preview Mode Changed',
  INSERT_BLOCK_DIALOG_SHORTCUT_HELP_OPENED: 'Insert Block Dialog Shortcut Help Opened',
  INSERT_BLOCK_DIALOG_BLOCK_SEARCHED: 'Insert Block Dialog Block Searched',

  
  QUICK_BLOCK_SELECTOR_OPENED: 'Quick Block Selector Opened',
  QUICK_BLOCK_SELECTOR_CLOSED: 'Quick Block Selector Closed',
  QUICK_BLOCK_SELECTOR_BLOCKS_INSERTED: 'Quick Block Selector Blocks Inserted',
  QUICK_BLOCK_SELECTOR_BLOCK_SEARCHED: 'Quick Block Selector Block Searched',
  QUICK_BLOCK_SELECTOR_BLOCK_TYPE_FILTER_CHANGED: 'Quick Block Selector Block Type Filter Changed',

  // Tutorial events
  TUTORIAL_VIDEO_PLAYED: 'Tutorial Video Played',
  SUBSTACK_CLICKED: 'Substack Clicked',
  TUTORIAL_GIF_HOVERED: 'Tutorial GIF Hovered',

  // Notification events
  NOTIFICATIONS_PANEL_OPENED: 'Notifications Panel Opened',
  NOTIFICATION_ACTION_CLICKED: 'Notification Action Clicked',
  NOTIFICATION_MARKED_READ: 'Notification Marked Read',
  NOTIFICATION_MARK_ALL_READ: 'Notification Mark All Read',
  NOTIFICATION_DELETED: 'Notification Deleted',


  // Settings events
  SETTINGS_OPENED: 'Settings Opened',
  SETTINGS_CHANGED: 'Settings Changed',

  PANEL_CLOSED: 'Panel Closed',
  
  // Network interceptor events
  MESSAGE_CAPTURED: 'Message Captured',
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

  // Sharing Events
  SHARE_DIALOG_OPENED: 'Share Dialog Opened',
  SHARE_FRIEND_INVITED: 'Share Friend Invited',
  SHARE_TEAM_INVITE_REQUESTED: 'Share Team Invite Requested', 
  SHARE_REFERRAL_JOIN_REQUESTED: 'Share Referral Join Requested',
  SHARE_INVITATION_EMAIL_SENT: 'Share Invitation Email Sent',
  SHARE_INVITATION_EMAIL_FAILED: 'Share Invitation Email Failed',
  SHARE_INVITATION_ACCEPTED: 'Share Invitation Accepted',
  SHARE_STATS_VIEWED: 'Share Stats Viewed',
  
  // Referral Events
  REFERRAL_SIGNUP_COMPLETED: 'Referral Signup Completed',
  REFERRAL_REWARD_EARNED: 'Referral Reward Earned',
  REFERRAL_CODE_GENERATED: 'Referral Code Generated',
  
  // Team Events
  TEAM_INVITATION_SENT: 'Team Invitation Sent',
  TEAM_MEMBER_JOINED: 'Team Member Joined',

};

/**
 * Set user properties to track
 * @param properties User properties to track
 */
export const setUserProperties = (properties: Record<string, unknown>) => {
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