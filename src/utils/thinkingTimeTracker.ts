// src/utils/thinkingTimeTracker.ts

/**
 * Tracks thinking time while ChatGPT is generating a response
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
   * Start tracking thinking time
   */
  public startTracking(): Promise<number> {
    if (this.activeTracking) {
      return this.waitForCompletion();
    }
    
    return new Promise((resolve) => {
      this.activeTracking = true;
      this.startTime = Date.now();
      this.thinkingTime = 0;
      
      const stopButton = document.querySelector('button[data-testid="stop-button"]');
      
      if (!stopButton) {
        this.waitForStopButton(resolve);
      } else {
        this.startTimeTracking(resolve);
      }
    });
  }
  
  /**
   * Wait for tracking to complete if already tracking
   */
  private waitForCompletion(): Promise<number> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.activeTracking) {
          clearInterval(checkInterval);
          resolve(this.thinkingTime);
        }
      }, 100);
    });
  }
  
  /**
   * Wait for stop button to appear
   */
  private waitForStopButton(resolve: (value: number) => void): void {
    this.observer = new MutationObserver(() => {
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
    }, 10000);
  }
  
  /**
   * Start actual time tracking
   */
  private startTimeTracking(resolve: (value: number) => void): void {
    const stopButton = document.querySelector('button[data-testid="stop-button"]');
    if (!stopButton) {
      this.activeTracking = false;
      resolve(0);
      return;
    }
    
    // Update thinking time every 100ms
    this.intervalId = window.setInterval(() => {
      this.thinkingTime = (Date.now() - this.startTime) / 1000;
    }, 100);
    
    // Watch for stop button disappearance
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
    
    // Maximum tracking time
    setTimeout(() => {
      if (this.activeTracking) {
        this.stopTracking();
        resolve(this.thinkingTime);
      }
    }, 300000); // 5 minutes
  }
  
  /**
   * Stop tracking
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
    
    this.activeTracking = false;
  }
}

export const thinkingTimeTracker = ThinkingTimeTracker.getInstance();