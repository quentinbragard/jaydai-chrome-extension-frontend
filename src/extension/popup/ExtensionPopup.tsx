// src/extension/popup/ExtensionPopup.tsx
import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { LoginForm } from './components/LoginForm';
import { ToolGrid } from './components/ToolGrid';
import { LoadingState } from './components/LoadingState';
import { AppHeader } from './components/AppHeader';
import { AppFooter } from './components/AppFooter';
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import './popup.css';
import { getMessage } from '@/core/utils/i18n';
import { authService } from '@/services/auth/AuthService';
import { AuthState } from '@/types';

// Current extension version
const EXTENSION_VERSION = "1.0.0";

const ExtensionPopup: React.FC = () => {
  // Auth state
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Initialize auth state
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe(state => {
      setAuthState(state);
    });

    // Initialize auth service if needed
    if (!authService.isInitialized()) {
      authService.initialize();
    }

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast.success(getMessage('signedOut', undefined, 'Signed out successfully'));
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(getMessage('logoutFailed', undefined, 'Failed to sign out'));
    }
  };

  // OpenAI page navigation helper
  const openChatGPT = () => {
    chrome.tabs.create({ url: 'https://chat.openai.com' });
  };
  
  // Welcome page navigation helper
  const openWelcomePage = () => {
    chrome.tabs.create({ url: 'welcome.html' });
  };

  // Open settings page
  const openSettings = () => {
    chrome.tabs.create({ url: 'options.html' });
  };
  
  // Open help page
  const openHelp = () => {
    chrome.tabs.create({ url: 'https://archimind.ai/help' });
  };

  // Loading state
  if (authState.isLoading) {
    return <LoadingState />;
  }

  return (
    <ThemeProvider>
      <div className="w-80 bg-gradient-to-b from-background to-background/80 backdrop-blur overflow-hidden">
        <Card className="w-full border-none shadow-none relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></div>
          
          <AppHeader 
            isAuthenticated={authState.isAuthenticated} 
            user={authState.user} 
          />
          
          {authState.isAuthenticated && authState.user ? (
            <ToolGrid onLogout={handleLogout} onOpenChatGPT={openChatGPT} />
          ) : (
            <LoginForm 
              authState={authState} 
              onWelcomePageClick={openWelcomePage} 
            />
          )}
          
          <AppFooter 
            version={EXTENSION_VERSION}
          />
        </Card>
      </div>
    </ThemeProvider>
  );
};

export default ExtensionPopup;