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
      if (!ref.current) return;

      const path = event.composedPath ? event.composedPath() : [];

      // Ignore events originating from Radix Select portals
      const clickedRadixSelect = path.some(
        (el) =>
          el instanceof HTMLElement &&
          (el.hasAttribute('data-radix-select-content') ||
            el.hasAttribute('data-radix-select-trigger'))
      );
      if (clickedRadixSelect) return;

      const clickedInside = path.some(
        (el) => el instanceof Node && ref.current!.contains(el as Node)
      );

      if (!clickedInside) {
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