// src/components/Main.tsx
import React, { useEffect } from 'react';
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

  // Sync theme with parent document
  useEffect(() => {
    const syncTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      // Get the shadow container inside this component's shadow DOM
      const shadowContainer = document.getElementById('jaydai-shadow-container');
      if (shadowContainer) {
        if (isDarkMode) {
          shadowContainer.classList.add('dark');
        } else {
          shadowContainer.classList.remove('dark');
        }
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
    <div id="jaydai-root jd-w-full jd-h-screen">
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            {/* Add QueryProvider to wrap DialogProvider */}
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