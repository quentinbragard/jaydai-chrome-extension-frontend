// src/hooks/useThemeDetector.ts
import { useState, useEffect } from 'react';

/**
 * Custom hook that detects the current theme from the host website (e.g., Claude.ai)
 * for use in Chrome extensions.
 * 
 * Priority checks:
 * 1. data-mode attribute (highest priority)
 * 2. color-scheme CSS property
 * 3. HTML/body classes and other attributes
 */
export function useThemeDetector() {
  // Initialize state with the current theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return detectDarkMode();
  });

  // Function to check various indicators of dark mode
  function detectDarkMode(): boolean {
    if (typeof document === 'undefined') return false;
    
    // 1. HIGHEST PRIORITY: Check data-mode attribute (specific to Claude.ai)
    const dataMode = document.documentElement.getAttribute('data-mode');
    if (dataMode === 'dark') {
      return true;
    }
    if (dataMode === 'light') {
      return false;
    }
    
    // 2. Check color-scheme style if it contains 'dark'
    const htmlStyles = window.getComputedStyle(document.documentElement);
    const colorScheme = htmlStyles.getPropertyValue('color-scheme');
    if (colorScheme.includes('dark')) {
      return true;
    }
    
    // 3. Check if the html element has a 'dark' class
    if (document.documentElement.classList.contains('dark')) {
      return true;
    }
    
    // 4. Check data-theme attribute
    const dataTheme = document.documentElement.getAttribute('data-theme');
    if (dataTheme === 'dark' || dataTheme === 'night' || dataTheme === 'black') {
      return true;
    }
    
    // 5. Check for body class or attribute
    if (document.body.classList.contains('dark') || 
        document.body.classList.contains('dark-mode') ||
        document.body.classList.contains('dark-theme') ||
        document.body.getAttribute('data-theme') === 'dark') {
      return true;
    }
    
    // 6. Check for specific CSS variables
    const bodyStyles = window.getComputedStyle(document.body);
    const themeColor = bodyStyles.getPropertyValue('--theme') || 
                       bodyStyles.getPropertyValue('--theme-mode') ||
                       bodyStyles.getPropertyValue('--color-scheme');
    
    if (themeColor.includes('dark')) {
      return true;
    }

    // Default to light mode if none of the checks pass
    return false;
  }

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    // Function to update theme state
    const updateThemeState = () => {
      setIsDarkMode(detectDarkMode());
    };

    // Set up document observer for theme changes
    const documentObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class' || 
            mutation.attributeName === 'data-theme' || 
            mutation.attributeName === 'data-mode' || 
            mutation.attributeName === 'style') {
          updateThemeState();
          break; // Only need to update once if multiple attributes change
        }
      }
    });

    // Observe both the html and body elements
    documentObserver.observe(document.documentElement, { attributes: true });
    documentObserver.observe(document.body, { attributes: true });
    
    // Update on window resize and visibility change
    window.addEventListener('resize', updateThemeState);
    document.addEventListener('visibilitychange', updateThemeState);
    
    // Initial update
    updateThemeState();
    
    // Cleanup
    return () => {
      documentObserver.disconnect();
      window.removeEventListener('resize', updateThemeState);
      document.removeEventListener('visibilitychange', updateThemeState);
    };
  }, []);

  return isDarkMode;
}

/**
 * A custom hook for components to get the current theme class name
 * @returns 'dark' or 'light' based on detected theme
 */
export function useThemeClass() {
  const isDarkMode = useThemeDetector();
  return isDarkMode ? 'dark' : 'light';
}

/**
 * A utility function to get the current theme without using hooks
 * @returns 'dark' or 'light' based on detected theme
 */
export function getCurrentTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'light';
  
  // 1. HIGHEST PRIORITY: Check data-mode attribute
  const dataMode = document.documentElement.getAttribute('data-mode');
  if (dataMode === 'dark') {
    return 'dark';
  }
  if (dataMode === 'light') {
    return 'light';
  }
  
  // 2. Check color-scheme style
  const htmlStyles = window.getComputedStyle(document.documentElement);
  const colorScheme = htmlStyles.getPropertyValue('color-scheme');
  if (colorScheme.includes('dark')) {
    return 'dark';
  }
  
  // 3. Check if html element has dark class
  if (document.documentElement.classList.contains('dark')) {
    return 'dark';
  }
  
  // 4. Check data-theme attribute
  const dataTheme = document.documentElement.getAttribute('data-theme');
  if (dataTheme === 'dark' || dataTheme === 'night' || dataTheme === 'black') {
    return 'dark';
  }
  
  // 5. Check body element
  if (document.body.classList.contains('dark') || 
      document.body.classList.contains('dark-mode') ||
      document.body.classList.contains('dark-theme') ||
      document.body.getAttribute('data-theme') === 'dark') {
    return 'dark';
  }
  
  // 6. Check CSS variables
  const bodyStyles = window.getComputedStyle(document.body);
  const themeColor = bodyStyles.getPropertyValue('--theme') || 
                     bodyStyles.getPropertyValue('--theme-mode') ||
                     bodyStyles.getPropertyValue('--color-scheme');
  
  if (themeColor.includes('dark')) {
    return 'dark';
  }
  
  // Default to light mode
  return 'light';
}