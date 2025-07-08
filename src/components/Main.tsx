
// src/components/Main.tsx
import React, { useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/state/AuthContext';
import MainButton from '@/components/MainButton';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { DialogProvider } from '@/components/dialogs/DialogProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/components/theme-provider';
import { initAmplitude, setUserProperties } from '@/utils/amplitude';
import { authService } from '@/services/auth/AuthService';
import { getCurrentLanguage } from '@/core/utils/i18n';

/**
 * Main app component that brings everything together
 * Handles providers, global UI elements, and lazy-loaded components
 */
const Main: React.FC = () => {
  // Reference to the shadow root host element
  const shadowRootRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    authService.subscribe((state) => {
      if (state.user) {
        initAmplitude(state.user.id, false);
        setUserProperties({
          darkMode: document.documentElement.classList.contains('dark'),
          language: getCurrentLanguage(),
          version: chrome.runtime.getManifest().version
        });
      }
    });
  }, []);

  return (
    <div id="jaydai-shadow-root" className="jd-w-full jd-h-full jd-z-[9999]">
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange
          >
            <QueryProvider>
              {/* Updated to use our new dialog system */}
              <DialogProvider>
                {/* UI Components */}
                <MainButton />
                {/* Toast notifications */}
                <div className="jd-fixed jd-top-4 jd-right-4 jd-z-[9999] jd-pointer-events-none jd-bg-transparent">
                <Toaster 
                  richColors 
                  position="top-right"
                  closeButton={true}
                  className="jd-toaster jd-group jd-pointer-events-auto"
                  toastOptions={{
                    classNames: {
                      toast: `
                        jd-group jd-toast 
                        jd-bg-background 
                        jd-text-foreground 
                        jd-border 
                        jd-border-[var(--border)] 
                        jd-border-l-4 
                        jd-border-l-[var(--primary)] 
                        jd-shadow-lg 
                        jd-rounded-xl 
                        jd-p-4 
                        jd-max-w-xs 
                        jd-w-full 
                        jd-relative 
                        jd-overflow-hidden
                        jd-transition-all 
                        jd-duration-300 
                        jd-ease-out
                        dark:jd-border-[var(--border)]
                        dark:jd-border-l-[var(--foreground)]
                        jd-flex 
                        jd-items-center 
                        jd-gap-3
                      `,
                      title: "jd-font-semibold jd-text-sm jd-text-[var(--foreground)]",
                      description: "jd-text-xs jd-text-[var(--muted-foreground)]",
                      closeButton: `
                        jd-text-[var(--muted-foreground)] 
                        hover:jd-text-[var(--foreground)] 
                        jd-transition-colors 
                        jd-duration-200 
                        jd-rounded-full 
                        jd-p-1 
                        hover:jd-bg-[var(--accent)] 
                        dark:hover:jd-bg-[var(--accent)]
                      `,
                      actionButton: `
                        jd-bg-[var(--primary)] 
                        jd-text-[var(--primary-foreground)] 
                        jd-rounded-md 
                        jd-px-3 
                        jd-py-1.5 
                        jd-text-sm 
                        jd-font-medium 
                        hover:jd-bg-[var(--primary)]/90 
                        jd-transition-colors
                        dark:hover:jd-opacity-90
                      `,
                      cancelButton: `
                        jd-bg-[var(--secondary)] 
                        jd-text-[var(--secondary-foreground)] 
                        jd-rounded-md 
                        jd-px-3 
                        jd-py-1.5 
                        jd-text-sm 
                        jd-font-medium 
                        hover:jd-bg-[var(--secondary)]/90 
                        jd-transition-colors
                        dark:hover:jd-opacity-90
                      `,
                    },
                  }}
                />
              </div>
              </DialogProvider>
            </QueryProvider>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </div>
  );
};

export default Main;