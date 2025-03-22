// src/services/analytics/StatsService.ts
import { AbstractBaseService } from '../BaseService';
import { userApi } from "@/api";
import { debug } from '@/core/config';
import { errorReporter } from '@/core/errors/ErrorReporter';
import { AppError, ErrorCode } from '@/core/errors/AppError';
import { emitEvent, AppEvent } from '@/core/events/events';

export interface Stats {
  totalChats: number;
  totalMessages: number;
  avgMessagesPerChat: number;
  messagesPerDay: Record<string, number>;
  efficiency?: number;
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
}

export interface ChartData {
  labels: string[];
  values: number[];
}

/**
 * Service to manage and update extension usage statistics
 */
export class StatsService extends AbstractBaseService {
  private stats: Stats = {
    totalChats: 0,
    totalMessages: 0,
    avgMessagesPerChat: 0,
    messagesPerDay: {},
    tokenUsage: {
      total: 0,
      lastMonth: 0
    },
    energy: {
      total: 0,
      perMessage: 0
    },
    thinkingTime: {
      total: 0,
      average: 0
    }
  };
  private updateInterval: number | null = null;
  private updateCallbacks: ((stats: Stats) => void)[] = [];
  private lastLoadTime: number = 0;
  private retryCount: number = 0;
  private isLoading: boolean = false;
  private static instance: StatsService;

   private constructor() {
    super();
  }
  
  public static getInstance(): StatsService {
    if (!StatsService.instance) {
      StatsService.instance = new StatsService();
    }
    return StatsService.instance;
  }

  /**
   * Initialize stats tracking
   */
  protected async onInitialize(): Promise<void> {
    debug('Initializing stats service...');
    
    // Listen for relevant events
    this.setupEventListeners();
    
    // Load initial stats
    await this.loadStats();
    
    // Set up regular refresh from backend
    this.updateInterval = window.setInterval(() => {
      // Only refresh if it's been at least 1 minute since the last load
      const now = Date.now();
      if (now - this.lastLoadTime >= 60000) {
        this.loadStats();
      }
    }, 60000); // Check every minute
    
    debug('Stats service initialized');
  }
  
  /**
   * Clean up resources
   */
  protected onCleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.updateCallbacks = [];
    debug('Stats service cleaned up');
  }
  
  /**
   * Set up event listeners for tracking stats
   */
  private setupEventListeners(): void {
    // Example: listen for message events to track message counts
    document.addEventListener('archimind-network-intercept', this.handleNetworkEvent);
  }
  
  /**
   * Handle network interception events for stats
   */
  private handleNetworkEvent = (event: CustomEvent): void => {
    const { type, data } = event.detail;
    
    if (!data) return;
    
    try {
      switch (type) {
        case 'chatCompletion':
          // Track user message sent
          this.trackMessageSent(data);
          break;
        case 'assistantResponse':
          // Track assistant response if complete
          if (data.isComplete) {
            this.trackMessageReceived(data);
          }
          break;
      }
    } catch (error) {
      debug('Error handling stats event:', error);
    }
  };
  
  /**
   * Track when a user sends a message
   */
  private trackMessageSent(data: any): void {
    // Local tracking could be implemented here
    // For example, increment a counter or add to local storage
    // This would be synced with the backend periodically
  }
  
  /**
   * Track when an assistant message is received
   */
  private trackMessageReceived(data: any): void {
    // Track thinking time if available
    if (data.thinkingTime) {
      // Update local stats
      this.stats.thinkingTime.total += data.thinkingTime;
      // Recalculate average
      this.stats.thinkingTime.average = 
        this.stats.totalMessages > 0 ? this.stats.thinkingTime.total / this.stats.totalMessages : 0;
    }
  }
  
  /**
   * Get current stats
   */
  public getStats(): Stats {
    return { ...this.stats };
  }
  
  /**
   * Get chart data for messages per day
   */
  public getMessagesPerDayChart(): ChartData {
    const sortedDays = Object.keys(this.stats.messagesPerDay).sort();
    return {
      labels: sortedDays,
      values: sortedDays.map(day => this.stats.messagesPerDay[day])
    };
  }
  
  /**
   * Get energy usage chart data
   */
  public getEnergyUsageChart(): ChartData {
    // Example: Create chart data for energy usage (would depend on your data structure)
    // In a real implementation, this would extract the appropriate data
    return {
      labels: ['Current', 'Previous'],
      values: [this.stats.energy.total, 0] // Would be actual comparative data
    };
  }
  
  /**
   * Manually refresh stats from backend
   */
  public async refreshStats(): Promise<void> {
    return this.loadStats(true);
  }
  
  /**
   * Register for stats updates
   * @returns Cleanup function to unregister
   */
  public onUpdate(callback: (stats: Stats) => void): () => void {
    this.updateCallbacks.push(callback);
    
    // Call immediately with current stats
    callback({ ...this.stats });
    
    // Return cleanup function
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Load stats from backend with improved error handling
   */
  private async loadStats(forceRefresh = false): Promise<void> {
    // Skip if not forced and loaded recently
    if (!forceRefresh && Date.now() - this.lastLoadTime < 60000) {
      return;
    }
    
    // Prevent concurrent loads
    if (this.isLoading) {
      return;
    }
    
    this.isLoading = true;
    
    try {
      debug('Loading stats from backend...');
      const data = await userApi.getUserStats();
      
      if (data) {
        // Merge backend stats with local tracking
        this.stats = {
          ...this.stats,
          totalChats: data.total_chats || this.stats.totalChats,
          totalMessages: data.total_messages || this.stats.totalMessages,
          avgMessagesPerChat: data.avg_messages_per_chat || this.stats.avgMessagesPerChat,
          efficiency: data.efficiency !== undefined ? data.efficiency : this.stats.efficiency,
          tokenUsage: {
            total: data.token_usage?.total || this.stats.tokenUsage.total,
            lastMonth: data.token_usage?.last_month || this.stats.tokenUsage.lastMonth
          },
          energy: {
            total: data.energy_usage?.total || this.stats.energy.total,
            perMessage: data.energy_usage?.per_message || this.stats.energy.perMessage
          },
          thinkingTime: {
            total: data.thinking_time?.total || this.stats.thinkingTime.total,
            average: data.thinking_time?.average || this.stats.thinkingTime.average
          }
        };
        
        // If backend provides daily message counts, merge them
        if (data.messages_per_day) {
          for (const [day, count] of Object.entries(data.messages_per_day)) {
            this.stats.messagesPerDay[day] = count as number;
          }
        }
        
        debug('Stats updated from backend');
        this.lastLoadTime = Date.now();
        this.retryCount = 0; // Reset retry count on success
        this.notifyUpdateListeners();
        
        // Emit event for other components
        emitEvent(AppEvent.STATS_UPDATED, { stats: this.getStats() });
      }
    } catch (error) {
      errorReporter.captureError(
        new AppError('Error loading stats', ErrorCode.API_ERROR, error)
      );
      
      // Implement retry with exponential backoff
      if (this.retryCount < 3) {
        this.retryCount++;
        const delay = Math.pow(2, this.retryCount) * 1000; // 2s, 4s, 8s
        debug(`Will retry loading stats in ${delay/1000}s (attempt ${this.retryCount}/3)`);
        
        setTimeout(() => {
          this.isLoading = false;
          this.loadStats();
        }, delay);
      } else {
        // Use fallback data for initial display if all retries fail
        if (this.lastLoadTime === 0) {
          debug('Using fallback stats data after multiple failed attempts');
          
          // Update with at least some minimal info if we have it
          if (this.stats.totalMessages === 0) {
            const today = new Date().toISOString().split('T')[0];
            this.stats.messagesPerDay[today] = this.stats.messagesPerDay[today] || 0;
            
            this.notifyUpdateListeners();
          }
        }
        
        // Reset retry count for next attempt
        this.retryCount = 0;
      }
    } finally {
      // If we're not planning a retry, mark as not loading
      if (this.retryCount === 0) {
        this.isLoading = false;
      }
    }
  }
  
  /**
   * Notify all update listeners
   */
  private notifyUpdateListeners(): void {
    const statsCopy = { ...this.stats };
    
    this.updateCallbacks.forEach(callback => {
      try {
        callback(statsCopy);
      } catch (error) {
        errorReporter.captureError(
          new AppError('Error in stats update callback', ErrorCode.EXTENSION_ERROR, error)
        );
      }
    });
  }
}

// Don't export a singleton instance here - we'll create it when registering services
// This allows for better testing and dependency injection