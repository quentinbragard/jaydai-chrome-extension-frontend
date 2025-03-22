// src/components/Main.tsx
import React, { Suspense } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/state/AuthContext';
import MainButton from '@/components/layout/MainButton';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import LoadingSpinner from '@/components/common/LoadingSpinner';
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
          
          {/* Stats Panel with suspense fallback */}
          <Suspense fallback={<div className="fixed top-4 left-1/2 transform -translate-x-1/2">
            <LoadingSpinner size="sm" message="Loading stats..." />
          </div>}>
            
          </Suspense>
          
          {/* Toast notifications */}
          <Toaster richColors position="top-right" />
        </DialogProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default Main;