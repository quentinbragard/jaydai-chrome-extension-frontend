// src/core/events/EventBus.ts

type EventCallback = (data: any) => void;

/**
 * Application-wide event bus for decoupled communication
 */
export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  
  private constructor() {}
  
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  /**
   * Subscribe to an event
   */
  public on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }
  
  /**
   * Emit an event
   */
  public emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
  
  /**
   * Subscribe to an event only once
   */
  public once(event: string, callback: EventCallback): void {
    const wrapper = (data: any) => {
      callback(data);
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(wrapper);
      }
    };
    
    this.on(event, wrapper);
  }
  
  /**
   * Remove all listeners for an event
   */
  public off(event: string): void {
    this.listeners.delete(event);
  }
  
  /**
   * Reset the event bus
   */
  public reset(): void {
    this.listeners.clear();
  }
}

export const eventBus = EventBus.getInstance();