/**
 * Types related to notifications
 */

// Base notification structure
export interface NotificationBase {
  type: string;
  title: string;
  body: string;
  action_button?: string;
}

// Notification creation structure
export interface NotificationCreate extends NotificationBase {
  user_id: string;
}

// Notification response structure
export interface NotificationResponse extends NotificationBase {
  id: number;
  created_at: string;
  read_at: string | null;
}

// Notification counts response
export interface NotificationCountsResponse {
  total: number;
  unread: number;
}

// API response types
export interface NotificationReadResponse {
  success: boolean;
  notification_id: string;
  read_at: string;
}

export interface NotificationReadAllResponse {
  success: boolean;
  notifications_updated: number;
}

export interface NotificationDeleteResponse {
  success: boolean;
  notification_id: string;
}

// Different notification types
export type NotificationType = 
  | 'welcome_first_conversation' 
  | 'insight_prompt_length' 
  | 'insight_response_time' 
  | 'insight_conversation_quality'
  | 'template_suggestion'
  | 'energy_usage_alert'
  | 'new_feature'
  | 'system_update'
  | 'account_reminder'
  | 'info'
  | 'warning'
  | 'error'
  | 'success';

  export interface NotificationActionMetadata {
    action_type: string;        // Type of action (e.g., "openUrl")
    action_title_key: string;   // Text to display on action button
    action_url?: string;        // Optional URL for openUrl action type
  }
  

// Notification priority levels
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Notification filters
export interface NotificationFilter {
  type?: NotificationType[];
  readStatus?: 'read' | 'unread' | 'all';
  dateFrom?: Date;
  dateTo?: Date;
}

// Notification panel props
export interface NotificationsPanelProps {
  onClose?: () => void;
  maxHeight?: string;
  filters?: NotificationFilter;
}

// API response structure
export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unread_count: number;
  error?: string;
}