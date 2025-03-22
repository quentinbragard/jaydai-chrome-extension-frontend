/**
 * Types related to notifications
 */

// Basic notification structure
export interface Notification {
       id: string;
       title: string;
       body: string;
       type: NotificationType;
       action_button?: string;
       created_at: string;
       read_at?: string | null;
       metadata?: Record<string, any>;
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