import React, { Suspense } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/state/AuthContext';
import MainButton from '@/components/layout/MainButton';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AuthDialog from '@/components/auth/AuthDialog';
import SettingsDialog from '@/components/dialogs/SettingsDialog';

// Lazy-loaded components
const StatsPanel = React.lazy(() => import('@/components/panels/StatsPanel'));

/**
 * Main app component that brings everything together
 * Handles providers, global UI elements, and lazy-loaded components
 */
const Main: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {/* UI Components */}
        <MainButton
          onSettingsClick={() => {
            // Open settings dialog using DialogManager
            window.dialogManager?.openDialog('settings');
          }}
        />
        
        {/* Stats Panel with suspense fallback */}
        <Suspense fallback={<div className="fixed top-4 left-1/2 transform -translate-x-1/2">
          <LoadingSpinner size="sm" message="Loading stats..." />
        </div>}>
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2">
            <StatsPanel compact />
          </div>
        </Suspense>
        
        {/* Global Dialogs */}
        <AuthDialog />
        <SettingsDialog />
        
        {/* Toast notifications */}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default Main;