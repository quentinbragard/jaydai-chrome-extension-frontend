// src/services/StatsService.ts
import { apiService } from './ApiService';
import { chatInterceptor } from './chat';

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
    total: number;  // watt-hours
    perMessage: number;
  };
  thinkingTime: {
    total: number;  // seconds
    average: number;
  };
}

/**
 * Service to manage and update extension usage statistics
 */
export class StatsService {
  private static instance: StatsService;
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
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): StatsService {
    if (!StatsService.instance) {
      StatsService.instance = new StatsService();
    }
    return StatsService.instance;
  }
  
  /**
   * Initialize stats tracking
   */
  public initialize(): void {
    console.log('📊 Initializing stats service...');
    
    // Load initial stats with a small delay to ensure auth is ready
    setTimeout(() => {
      this.loadStats();
    }, 2000);
    
    // Listen for new messages
    chatInterceptor.onMessage((event) => {
      // Update local counters immediately for responsive UI
      this.stats.totalMessages++;
      
      // Track by day
      const today = new Date().toISOString().split('T')[0];
      this.stats.messagesPerDay[today] = (this.stats.messagesPerDay[today] || 0) + 1;
      
      // Update average
      if (this.stats.totalChats > 0) {
        this.stats.avgMessagesPerChat = this.stats.totalMessages / this.stats.totalChats;
      }
      
      // Notify subscribers of the update
      this.notifyUpdateListeners();
    });
    
    // Set up regular refresh from backend
    this.updateInterval = window.setInterval(() => {
      // Only refresh if it's been at least 1 minute since the last load
      const now = Date.now();
      if (now - this.lastLoadTime >= 60000) {
        this.loadStats();
      }
    }, 60000); // Check every minute
    
    console.log('✅ Stats service initialized');
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.updateCallbacks = [];
    console.log('✅ Stats service cleaned up');
  }
  
  /**
   * Get current stats
   */
  public getStats(): Stats {
    return { ...this.stats };
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
  private async loadStats(): Promise<void> {
    // Prevent concurrent loads
    if (this.isLoading) {
      return;
    }
    
    this.isLoading = true;
    
    try {
      console.log('📊 Loading stats from backend...');
      const data = await apiService.getUserStats();
      
      if (data) {
        // Merge backend stats with local tracking
        this.stats = {
          ...this.stats,
          totalChats: data.total_chats || this.stats.totalChats,
          totalMessages: data.total_messages || this.stats.totalMessages,
          avgMessagesPerChat: data.avg_messages_per_chat || this.stats.avgMessagesPerChat,
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
        
        console.log('📊 Stats updated from backend');
        this.lastLoadTime = Date.now();
        this.retryCount = 0; // Reset retry count on success
        this.notifyUpdateListeners();
      }
    } catch (error) {
      console.error('❌ Error loading stats:', error);
      
      // Implement retry with exponential backoff
      if (this.retryCount < 3) {
        this.retryCount++;
        const delay = Math.pow(2, this.retryCount) * 1000; // 2s, 4s, 8s
        console.log(`⏱️ Will retry loading stats in ${delay/1000}s (attempt ${this.retryCount}/3)`);
        
        setTimeout(() => {
          this.isLoading = false;
          this.loadStats();
        }, delay);
      } else {
        // Use fallback data for initial display if all retries fail
        if (this.lastLoadTime === 0) {
          console.log('⚠️ Using fallback stats data after multiple failed attempts');
          
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
        console.error('❌ Error in stats update callback:', error);
      }
    });
  }
}

// Export the singleton instance
export const statsService = StatsService.getInstance();