// src/utils/amplitude/index.ts - Server-side analytics client (Chrome Extension Safe)

import { detectPlatform } from '@/platforms/platformManager';
import { getCurrentLanguage } from '@/core/utils/i18n';

interface AnalyticsEvent {
  event_name: string;
  event_properties?: Record<string, any>;
  user_id?: string;
  timestamp?: string;
  session_id?: string;
  platform?: string;
  extension_version?: string;
}

interface AnalyticsBatch {
  events: AnalyticsEvent[];
  user_context?: Record<string, any>;
}

class ServerAnalyticsClient {
  private apiUrl: string;
  private sessionId: string;
  private isInitialized: boolean = false;
  private queue: AnalyticsEvent[] = [];
  private userId?: string;
  private flushInterval: number = 10000; // 10 seconds
  private maxQueueSize: number = 20;
  private flushTimer?: NodeJS.Timeout;
  private userProperties: Record<string, any> = {};

  constructor() {
    this.apiUrl = process.env.VITE_API_URL || '';
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private async getAuthToken(): Promise<string | null> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'getAuthToken' }, (response) => {
          if (response?.success && response.token) {
            resolve(response.token);
          } else {
            resolve(null);
          }
        });
      } else {
        // Fallback for non-extension environments
        resolve(null);
      }
    });
  }

  private detectOperatingSystem(): string {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    // Detect macOS
    if (platform.includes('Mac') || userAgent.includes('Macintosh')) {
      return 'macOS';
    }
    
    // Detect Windows
    if (platform.includes('Win') || userAgent.includes('Windows')) {
      return 'Windows';
    }
    
    // Detect Linux
    if (platform.includes('Linux') || userAgent.includes('Linux')) {
      return 'Linux';
    }
    
    // Detect Chrome OS
    if (userAgent.includes('CrOS')) {
      return 'Chrome OS';
    }
    
    // Additional checks for specific cases
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      return 'iOS';
    }
    
    if (userAgent.includes('Android')) {
      return 'Android';
    }
    
    // Fallback
    return 'Unknown';
  }

  public getDetailedPlatformInfo() {
    const userAgent = navigator.userAgent;
    
    // Extract more detailed OS version info
    let osVersion = 'Unknown';
    
    if (this.detectOperatingSystem() === 'macOS') {
      const macMatch = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
      if (macMatch) {
        osVersion = macMatch[1].replace(/_/g, '.');
      }
    } else if (this.detectOperatingSystem() === 'Windows') {
      const winMatch = userAgent.match(/Windows NT (\d+\.\d+)/);
      if (winMatch) {
        const version = winMatch[1];
        // Convert Windows NT versions to friendly names
        const windowsVersions: Record<string, string> = {
          '10.0': 'Windows 10/11',
          '6.3': 'Windows 8.1',
          '6.2': 'Windows 8',
          '6.1': 'Windows 7',
          '6.0': 'Windows Vista'
        };
        osVersion = windowsVersions[version] || `Windows NT ${version}`;
      }
    } else if (this.detectOperatingSystem() === 'Linux') {
      // Try to detect Linux distribution
      if (userAgent.includes('Ubuntu')) {
        osVersion = 'Ubuntu';
      } else if (userAgent.includes('Fedora')) {
        osVersion = 'Fedora';
      } else {
        osVersion = 'Linux';
      }
    }
    
    return {
      platform: this.detectOperatingSystem(),
      platform_version: osVersion,
      user_agent: userAgent,
      ai_tool: detectPlatform(),
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator_language: navigator.language,
      navigator_languages: navigator.languages?.join(', ') || navigator.language,
      extenion_language: getCurrentLanguage()
    };
  }

  public async init(userId?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('📊 Analytics already initialized');
      return;
    }

    if (!this.apiUrl) {
      console.warn('⚠️ API URL not configured - analytics disabled');
      return;
    }

    this.userId = userId;
    this.isInitialized = true;

    // Start the flush timer
    this.startFlushTimer();

    console.log('📊 Server-side analytics initialized');

    // Track initialization
    this.track(EVENTS.EXTENSION_OPENED, {
      initialization_method: 'server_side',
      api_url: this.apiUrl
    });
  }

  public setUserId(userId: string): void {
    this.userId = userId;
    
    // Identify user with any stored properties
    if (Object.keys(this.userProperties).length > 0) {
      this.identify(this.userProperties);
    }
  }

  public track(eventName: string, eventProperties?: Record<string, any>): void {
    if (!this.isInitialized) {
      console.warn('⚠️ Analytics not initialized - event not tracked:', eventName);
      return;
    }

    const aiPlatform = detectPlatform();
    const platformInfo = this.getDetailedPlatformInfo();
    
    const event: AnalyticsEvent = {
      event_name: eventName,
      event_properties: {
        ...eventProperties,
        ai_platform: aiPlatform,
        ...platformInfo,
        extension_version: chrome.runtime.getManifest().version,
        client_performance_now: performance.now(),
        sent_immediately: true
      },
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      platform: platformInfo.platform, // Use detected OS
      extension_version: process.env.VITE_APP_VERSION || 'unknown'
    };

    // Add to queue
    this.queue.push(event);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Event queued:', eventName, eventProperties);
    }

    // Flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  public async identify(userProperties: Record<string, any>): Promise<void> {
    if (!this.isInitialized || !this.userId) {
      // Store properties for later if not ready
      this.userProperties = { ...this.userProperties, ...userProperties };
      return;
    }

    try {
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.apiUrl}/analytics/identify`, {
        method: 'POST',
        headers,
        body: JSON.stringify(userProperties)
      });

      if (response.ok) {
        console.log('📊 User properties updated');
        // Clear stored properties after successful update
        this.userProperties = {};
      } else {
        console.error('❌ Failed to update user properties:', response.status);
      }
    } catch (error) {
      console.error('❌ Error updating user properties:', error);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  public async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const eventsToSend = [...this.queue];
    this.queue = [];

    try {
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const batch: AnalyticsBatch = {
        events: eventsToSend,
        user_context: {
          user_agent: navigator.userAgent,
          platform: 'chrome_extension',
          extension_version: process.env.VITE_APP_VERSION || 'unknown'
        }
      };

      const response = await fetch(`${this.apiUrl}/analytics/track-batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify(batch)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`📊 Successfully sent ${result.events_processed} events to server`);
        
        if (result.errors && result.errors.length > 0) {
          console.warn('⚠️ Some events had errors:', result.errors);
        }
      } else {
        console.error('❌ Failed to send events to server:', response.status);
        // Re-queue events for retry
        this.queue.unshift(...eventsToSend);
      }
    } catch (error) {
      console.error('❌ Error sending events to server:', error);
      // Re-queue events for retry
      this.queue.unshift(...eventsToSend);
    }
  }

  public reset(): void {
    this.userId = undefined;
    this.sessionId = this.generateSessionId();
    this.queue = [];
    this.userProperties = {};
  }

  public cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Send any remaining events
  }
}

// Create singleton instance
const analyticsClient = new ServerAnalyticsClient();

// Export functions that match your existing API
export const initAmplitude = (userId?: string, autoCapture = false) => {
  analyticsClient.init(userId);
};

export const setAmplitudeUserId = (userId: string) => {
  analyticsClient.setUserId(userId);
};

export const trackEvent = (eventName: string, eventProperties = {}) => {
  analyticsClient.track(eventName, eventProperties);
};

export const setUserProperties = (properties: Record<string, unknown>) => {
  analyticsClient.identify(properties as Record<string, any>);
};

export const incrementUserProperty = (property: string, value: number = 1) => {
  // Convert increment to a set operation with current value + increment
  // Note: This is a simplified version - for true incrementing, 
  // you'd need to track current values or handle it server-side
  const incrementProps: Record<string, any> = {};
  incrementProps[`${property}_increment`] = value;
  analyticsClient.identify(incrementProps);
};

export const trackPageView = (pageName: string) => {
  analyticsClient.track('Page Viewed', { page_name: pageName });
};

export const resetAmplitude = () => {
  analyticsClient.reset();
};

// Predefined events (keep your existing events)
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
  PAYWALL_OPENED: 'Paywall Opened',
  SUBSCRIPTION_CREATED: 'Subscription Created',
  SUBSCRIPTION_UPDATED: 'Subscription Updated',
  SUBSCRIPTION_CANCELLED: 'Subscription Cancelled',
  SUBSCRIPTION_RENEWED: 'Subscription Renewed',
    
  // Onboarding payment specific
  ONBOARDING_PAYMENT_STEP_VIEWED: 'Onboarding Payment Step Viewed',
  ONBOARDING_PAYMENT_COMPLETED: 'Onboarding Payment Completed',
  ONBOARDING_PAYMENT_CANCELLED: 'Onboarding Payment Cancelled',
  ONBOARDING_PAYMENT_SKIPPED: 'Onboarding Payment Skipped',

  // Post onboarding checklist events
  POST_ONBOARDING_CHECKLIST_ACTION_TAKEN: 'Post Onboarding Checklist Action Taken',
  POST_ONBOARDING_CHECKLIST_VIEWED: 'Post Onboarding Checklist Viewed',

  POPUP_OPENED: 'Popup Opened',
  POPUP_AI_TOOL_CLICKED: 'Popup AI Tool Clicked',

   // Settings panel events
   SETTINGS_PANEL_OPENED: 'Settings Panel Opened',
   DATA_COLLECTION_TOGGLED: 'Data Collection Toggled',
   MANAGE_SUBSCRIPTION_CLICKED: 'Manage Subscription Clicked',
   EXTERNAL_LINK_CLICKED: 'External Link Clicked',
  
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
  TUTORIAL_GIF_CLICKED: 'Tutorial GIF Clicked',

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
  SHARE_SOCIAL_PLATFORM: 'Share Social Platform Invite Sent',
  
  // Referral Events
  REFERRAL_SIGNUP_COMPLETED: 'Referral Signup Completed',
  REFERRAL_REWARD_EARNED: 'Referral Reward Earned',
  REFERRAL_CODE_GENERATED: 'Referral Code Generated',
  
  // Team Events
  TEAM_INVITATION_SENT: 'Team Invitation Sent',
  TEAM_MEMBER_JOINED: 'Team Member Joined',
} as const;

// Cleanup on extension unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analyticsClient.cleanup();
  });
}

// For debugging
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).serverAnalytics = analyticsClient;
}