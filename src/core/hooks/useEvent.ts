// src/core/hooks/useEvent.ts
import { useEffect } from 'react';
import { eventManager } from '../events/EventManager';
import { AppEvent, EventPayloads } from '../events/events';

/**
 * Hook for working with the event system
 */
export function useEvent<T extends AppEvent>(
  event: T, 
  callback: (payload: EventPayloads[T]) => void,
  deps: any[] = []
): void {
  useEffect(() => {
    // Subscribe to the event
    const unsubscribe = eventManager.on(event, callback);
    
    // Clean up subscription on unmount
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]); 
}

/**
 * Hook for emitting events
 */
export function useEventEmitter() {
  return {
    emit: <T extends AppEvent>(event: T, payload: EventPayloads[T]) => {
      eventManager.emit(event, payload);
    }
  };
}