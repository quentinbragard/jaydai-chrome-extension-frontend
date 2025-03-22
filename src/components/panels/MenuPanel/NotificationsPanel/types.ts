export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'welcome_first_conversation' | 
         'insight_prompt_length' | 
         'insight_response_time' | 
         'insight_conversation_quality' | 
         string;
  action_button?: string;
  created_at: string;
  read_at?: string | null;
  metadata?: Record<string, any>;
}

export interface NotificationsPanelProps {
  onClose?: () => void;
  maxHeight?: string;
}