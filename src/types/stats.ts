/**
 * Types related to statistics and analytics
 */

// Basic stats shape
export interface Stats {
    totalChats: number;
    totalMessages: number;
    avgMessagesPerChat: number;
    messagesPerDay: Record<string, number>;
    tokenUsage: {
      total: number;
      lastMonth: number;
    };
    energy: {
      total: number;
      perMessage: number;
    };
    thinkingTime: {
      total: number;
      average: number;
    };
    efficiency?: number;
  }
  
  // Data for a time-based chart
  export interface TimeSeriesData {
    date: string;
    value: number;
    label?: string;
  }
  
  // Stats filtering options
  export interface StatsFilterOptions {
    timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
    startDate?: Date;
    endDate?: Date;
    modelType?: string;
    categories?: string[];
  }
  
  // A single data point for charts
  export interface DataPoint {
    x: string | number;
    y: number;
    category?: string;
  }
  
  // Message analytics data
  export interface MessageAnalytics {
    id: string;
    timestamp: number;
    wordCount: number;
    characterCount: number;
    tokenCount: number;
    estimatedEnergy: number;
    responseTime?: number;
    model?: string;
  }
  
  // Energy usage by model
  export interface ModelEnergyUsage {
    model: string;
    energy: number;
    requests: number;
    percentage: number;
  }
  
  // Session analytics
  export interface SessionStats {
    averageDuration: number;
    sessionsCount: number;
    sessionsPerDay: Record<string, number>;
    averageMessagesPerSession: number;
  }
  
  // Structure of analytics returned from the API
  export interface ApiAnalyticsResponse {
    success: boolean;
    data: {
      stats: Stats;
      sessions: SessionStats;
      messages: {
        count: number;
        byModel: Record<string, number>;
        timeDistribution: Record<string, number>;
      };
      energy: {
        total: number;
        byModel: ModelEnergyUsage[];
      };
    };
    error?: string;
  }