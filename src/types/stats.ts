/**
 * Types for Stats Service
 */


// Chart data structure
export interface ChartData {
  labels: string[];
  values: number[];
  colors?: string[];
}

// Weekly conversations data
export interface WeeklyConversations {
  weekly_conversations: number[];
  dates: string[];
}

// Message distribution data
export interface MessageDistribution {
  user_messages: number;
  ai_messages: number;
  ratio: number;
}

// User stats API response
export interface UserStatsResponse {
  total_chats: number;
  recent_chats: number;
  total_messages: number;
  avg_messages_per_chat: number;
  efficiency?: number;
  token_usage?: {
    recent: number;
    recent_input: number;
    recent_output: number;
    total: number;
    total_input: number;
    total_output: number;
  };
  energy_usage?: {
    recent: number;
    total: number;
    per_message: number;
  };
  thinking_time?: {
    total: number;
    average: number;
  };
  model_usage?: Record<string, {
    count: number;
    inputTokens: number;
    outputTokens: number;
  }>;
  messages_per_day?: Record<string, number>;
}

// Network event data for stats tracking
export interface StatsNetworkEvent {
  type: 'chatCompletion' | 'assistantResponse';
  data: {
    thinkingTime?: number;
    isComplete?: boolean;
  };
}