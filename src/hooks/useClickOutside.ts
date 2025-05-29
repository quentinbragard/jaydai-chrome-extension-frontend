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

      // Ignore events originating from Radix UI portals (like Select)
      const clickedRadixElement = path.some(
        el =>
          el instanceof HTMLElement &&
          Array.from(el.attributes).some(attr =>
            attr.name.startsWith('data-radix')
          )
      );
      if (clickedRadixElement) return;

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