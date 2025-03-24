// src/components/Main.tsx
import React from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/state/AuthContext';
import MainButton from '@/components/MainButton';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { DialogProvider } from '@/components/dialogs';


/**
 * Main app component that brings everything together
 * Handles providers, global UI elements, and lazy-loaded components
 */
const Main: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DialogProvider>
          {/* UI Components */}
          <MainButton />
          
          {/* Toast notifications */}
          <Toaster richColors position="top-right" />
        </DialogProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default Main;