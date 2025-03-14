// src/core/hooks/useEventListener.ts

import { useEffect, useRef } from 'react';
import { onEvent, AppEvent, EventPayloads } from '../events/events';

/**
 * Hook to listen for application events
 */
export function useEventListener<T extends AppEvent>(
  event: T, 
  callback: (payload: EventPayloads[T]) => void,
  deps: any[] = []
): void {
  // Use ref to avoid recreating the handler on every render
  const callbackRef = useRef(callback);
  
  // Update ref.current when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    // Create a handler that calls the ref.current
    const handler = (payload: EventPayloads[T]) => {
      callbackRef.current(payload);
    };
    
    // Subscribe to event
    const unsubscribe = onEvent(event, handler);
    
    // Clean up
    return unsubscribe;
  }, [event, ...deps]);
}