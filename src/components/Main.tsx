// src/components/Main.tsx
import React, { useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/state/AuthContext';
import MainButton from '@/components/MainButton';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { DialogProvider } from '@/components/dialogs';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/components/theme-provider';

/**
 * Main app component that brings everything together
 * Handles providers, global UI elements, and lazy-loaded components
 */
const Main: React.FC = () => {
  // Reference to the shadow root host element
  const shadowRootRef = useRef<HTMLElement | null>(null);

  // Ensure dialog system is properly setup
  useEffect(() => {
    // Check if dialog manager is properly initialized
    const checkDialogManager = () => {
      if (!window.dialogManager) {
        console.warn('Dialog manager not found, will try to initialize from DialogProvider');
      } else {
        console.log('Dialog manager is available in global scope');
      }
    };

    // Run check after component mount
    checkDialogManager();
    
    // Set a timeout to check again in case of initialization delay
    const timeoutId = setTimeout(checkDialogManager, 1000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Sync theme with parent document - properly handling Shadow DOM
  useEffect(() => {
    // Get a reference to the shadow host (the element containing the shadow root)
    shadowRootRef.current = document.getElementById('jaydai-root') as HTMLElement;
    
    // Find the actual shadow root
    const shadowRoot = shadowRootRef.current?.shadowRoot;
    
    if (!shadowRoot) {
      console.error('Shadow root not found, theme synchronization will not work');
      return;
    }

    const syncTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      
      // Apply dark mode directly to the shadow root host element
      if (shadowRootRef.current) {
        if (isDarkMode) {
          shadowRootRef.current.shadowRoot?.host.classList.add('dark');
        } else {
          shadowRootRef.current.shadowRoot?.host.classList.remove('dark');
        }
      }
      
      // Also store the theme value as an attribute for components that need it
      if (isDarkMode) {
        shadowRootRef.current?.setAttribute('data-theme', 'dark');
      } else {
        shadowRootRef.current?.setAttribute('data-theme', 'light');
      }
    };

    // Initial sync
    syncTheme();

    // Set up observer to watch for theme changes in the parent document
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class' &&
          mutation.target === document.documentElement
        ) {
          syncTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div id="jaydai-shadow-root" className="jd-w-full jd-h-full">
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange
          >
            <QueryProvider>
              <DialogProvider>
                {/* UI Components */}
                <MainButton />
                {/* Toast notifications */}
                <Toaster richColors position="top-right" />
              </DialogProvider>
            </QueryProvider>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </div>
  );
};

export default Main;