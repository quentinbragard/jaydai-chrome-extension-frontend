export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error' | string;
  action_button?: string;
  created_at: string;
  read_at?: string;
  seen_at?: string;
  metadata?: Record<string, any>;
}

export interface NotificationsPanelProps {
  onClose?: () => void;
  maxHeight?: string;
} 