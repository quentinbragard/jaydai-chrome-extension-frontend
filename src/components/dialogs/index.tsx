// src/components/dialogs/index.tsx
import React from 'react';
import { DialogProvider as DialogContextProvider } from './DialogContext';
import { TemplateDialog } from './templates/TemplateDialog';
import { FolderDialog } from './templates/FolderDialog';
import { PlaceholderEditor } from './templates/PlaceHolderEditor';
import { AuthDialog } from './auth/AuthDialog';
import { SettingsDialog } from './settings/SettingsDialog';
import { ConfirmationDialog } from './common/ConfirmationDialog';
import { EnhancedStatsDialog } from './analytics/EnhancedStatsDialog';

/**
 * Main dialog provider that includes all dialog components
 * This component ensures window.dialogManager is available
 */
export const DialogProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Debug check to verify dialog manager initialization
  React.useEffect(() => {
    console.log('DialogProvider mounted, checking dialogManager availability');
    
    // Monitor for any errors in dialog functionality
    const handleError = (error: ErrorEvent) => {
      if (error.message.includes('dialogManager') || error.message.includes('Dialog')) {
        console.error('Dialog system error detected:', error);
      }
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  return (
    <DialogContextProvider>
      {children}
      
      {/* Register all dialogs here */}
      <TemplateDialog />
      <FolderDialog />
      <PlaceholderEditor />
      <AuthDialog />
      <SettingsDialog />
      <ConfirmationDialog />
      <EnhancedStatsDialog />
    </DialogContextProvider>
  );
};

// Export individual components and hooks
export { DialogContextProvider } from './DialogContext';
export { useDialog, useDialogManager } from './DialogContext';
export { TemplateDialog } from './templates/TemplateDialog';
export { FolderDialog } from './templates/FolderDialog';
export { PlaceholderEditor } from './templates/PlaceHolderEditor';
export { AuthDialog } from './auth/AuthDialog';
export { SettingsDialog } from './settings/SettingsDialog';
export { ConfirmationDialog } from './common/ConfirmationDialog';
export { EnhancedStatsDialog } from './analytics/EnhancedStatsDialog';
export { BaseDialog } from './BaseDialog';