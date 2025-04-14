// src/hooks/useThemeDetector.ts
import { useState, useEffect } from 'react';

/**
 * Custom hook that detects the current theme from:
 * 1. The host document's HTML element class
 * 2. The shadow root's host element class
 * 3. The data-theme attribute on shadow root
 * 
 * This provides a reliable way to detect dark mode across the shadow DOM boundary
 */
export function useThemeDetector() {
  // Initialize state with the current theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check document theme first
    if (typeof document !== 'undefined') {
      if (document.documentElement.classList.contains('dark')) {
        return true;
      }
      
      // Check shadow root host element if available
      const shadowHost = document.getElementById('jaydai-root');
      if (shadowHost?.shadowRoot?.host.classList.contains('dark')) {
        return true;
      }
      
      // Check data-theme attribute as fallback
      if (shadowHost?.getAttribute('data-theme') === 'dark') {
        return true;
      }
    }
    return false;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const updateThemeState = () => {
      // Check document theme
      const documentIsDark = document.documentElement.classList.contains('dark');
      
      // Check shadow root host if available
      const shadowHost = document.getElementById('jaydai-root');
      const shadowIsDark = shadowHost?.shadowRoot?.host.classList.contains('dark') || false;
      
      // Check data-theme attribute as fallback
      const attributeIsDark = shadowHost?.getAttribute('data-theme') === 'dark';
      
      // Use document theme with fallbacks to shadow root indicators
      setIsDarkMode(documentIsDark || shadowIsDark || attributeIsDark);
    };

    // Set up document observer for theme changes
    const documentObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateThemeState();
        }
      });
    });

    documentObserver.observe(document.documentElement, { attributes: true });
    
    // Set up shadow host observer if available
    const shadowHost = document.getElementById('jaydai-root');
    let shadowObserver: MutationObserver | null = null;
    
    if (shadowHost) {
      shadowObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme') {
            updateThemeState();
          }
        });
      });
      
      shadowObserver.observe(shadowHost, { attributes: true });
    }
    
    // Initial update
    updateThemeState();
    
    return () => {
      documentObserver.disconnect();
      if (shadowObserver) shadowObserver.disconnect();
    };
  }, []);

  return isDarkMode;
}

// A custom hook for components to get the current theme class name
export function useThemeClass() {
  const isDarkMode = useThemeDetector();
  return isDarkMode ? 'dark' : 'light';
}

// A utility function to get the current theme without using hooks
export function getCurrentTheme(): 'dark' | 'light' {
  // Check document theme first
  if (typeof document !== 'undefined') {
    if (document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    
    // Check shadow root host element if available
    const shadowHost = document.getElementById('jaydai-root');
    if (shadowHost?.shadowRoot?.host.classList.contains('dark')) {
      return 'dark';
    }
    
    // Check data-theme attribute as fallback
    if (shadowHost?.getAttribute('data-theme') === 'dark') {
      return 'dark';
    }
  }
  return 'light';
}