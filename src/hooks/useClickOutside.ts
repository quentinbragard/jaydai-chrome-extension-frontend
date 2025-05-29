// src/hooks/useClickOutside.ts
import { useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  enabled: boolean = true
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;

      // If the click originates from a radix select component rendered in a portal,
      // ignore it so the select can handle the event properly
      const path = (event.composedPath && event.composedPath()) || [];
      const clickedRadixSelect = path.some((el) => {
        return (
          el instanceof HTMLElement &&
          (el.hasAttribute('data-radix-select-content') ||
            el.hasAttribute('data-radix-select-trigger'))
        );
      });

      if (clickedRadixSelect) return;

      if (ref.current && !ref.current.contains(target)) {
        handler();
      }
    };

    // Use capture phase to ensure we get the event before other handlers
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [handler, enabled]);

  return ref;
}