// src/utils/thinkingTimeTracker.ts

/**
 * Tracks the time while the ChatGPT "Stop" button is visible,
 * which indicates that the model is generating a response.
 */
export class ThinkingTimeTracker {
    private static instance: ThinkingTimeTracker;
    private activeTracking: boolean = false;
    private startTime: number = 0;
    private thinkingTime: number = 0;
    private observer: MutationObserver | null = null;
    private intervalId: number | null = null;
    
    private constructor() {}
    
    /**
     * Get the singleton instance
     */
    public static getInstance(): ThinkingTimeTracker {
      if (!ThinkingTimeTracker.instance) {
        ThinkingTimeTracker.instance = new ThinkingTimeTracker();
      }
      return ThinkingTimeTracker.instance;
    }
    
    /**
     * Start tracking thinking time when the stop button appears
     */
    public startTracking(): Promise<number> {
      // If already tracking, return the current promise
      if (this.activeTracking) {
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (!this.activeTracking) {
              clearInterval(checkInterval);
              resolve(this.thinkingTime);
            }
          }, 100);
        });
      }
      
      return new Promise((resolve) => {
        this.activeTracking = true;
        this.startTime = Date.now();
        this.thinkingTime = 0;
        
        // Find the stop button
        const stopButton = document.querySelector('button[data-testid="stop-button"]');
        
        // If stop button is not found initially, wait for it to appear
        if (!stopButton) {
          console.log('[ThinkingTimeTracker] Stop button not found, waiting...');
          
          // Start observer to detect when stop button appears
          this.observer = new MutationObserver((mutations) => {
            const stopButton = document.querySelector('button[data-testid="stop-button"]');
            if (stopButton) {
              this.observer?.disconnect();
              this.startTimeTracking(resolve);
            }
          });
          
          this.observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          
          // Set timeout to prevent indefinite waiting
          setTimeout(() => {
            if (this.observer) {
              this.observer.disconnect();
              this.observer = null;
              this.activeTracking = false;
              resolve(0);
            }
          }, 10000); // 10 second timeout
        } else {
          // Stop button already exists, start tracking
          this.startTimeTracking(resolve);
        }
      });
    }
    
    /**
     * Start the actual time tracking once the stop button is found
     */
    private startTimeTracking(resolve: (value: number) => void): void {
      console.log('[ThinkingTimeTracker] Stop button found, tracking thinking time...');
      
      const stopButton = document.querySelector('button[data-testid="stop-button"]');
      if (!stopButton) {
        this.activeTracking = false;
        resolve(0);
        return;
      }
      
      // Start timer to track thinking time
      this.intervalId = window.setInterval(() => {
        this.thinkingTime = (Date.now() - this.startTime) / 1000;
      }, 100);
      
      // Start observer to detect when stop button disappears
      this.observer = new MutationObserver(() => {
        const buttonStillExists = document.body.contains(stopButton);
        
        if (!buttonStillExists) {
          this.stopTracking();
          resolve(this.thinkingTime);
        }
      });
      
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Fallback in case observer doesn't trigger
      setTimeout(() => {
        if (this.activeTracking) {
          this.stopTracking();
          resolve(this.thinkingTime);
        }
      }, 300000); // 5 minute maximum
    }
    
    /**
     * Stop tracking and clean up resources
     */
    private stopTracking(): void {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      
      console.log(`[ThinkingTimeTracker] Final thinking time: ${this.thinkingTime.toFixed(2)}s`);
      this.activeTracking = false;
    }
    
    /**
     * Analyzes thinking time to estimate complexity
     * @param thinkingTime - Thinking time in seconds
     */
    public static getComplexityFromThinkingTime(thinkingTime: number): 'simple' | 'moderate' | 'complex' {
      if (thinkingTime < 2) {
        return 'simple';
      } else if (thinkingTime < 10) {
        return 'moderate';
      } else {
        return 'complex';
      }
    }
    
    /**
     * Estimates energy usage based on thinking time
     * @param thinkingTime - Thinking time in seconds
     * @param model - Model name (optional)
     */
    public static estimateEnergyUsage(thinkingTime: number, model = ''): number {
      // Base energy factor (very rough approximation)
      let energyFactor = 0.01; // watts per second
      
      // Adjust based on model if provided
      if (model.toLowerCase().includes('gpt-4')) {
        energyFactor = 0.025; // Higher for more complex models
      }
      
      return thinkingTime * energyFactor;
    }
  }
  
  // Export a singleton instance
  export const thinkingTimeTracker = ThinkingTimeTracker.getInstance();