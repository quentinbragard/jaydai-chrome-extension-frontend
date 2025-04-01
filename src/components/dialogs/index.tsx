// src/components/dialogs/index.tsx
import React, { useEffect } from 'react';
import { DialogManagerProvider } from './core/DialogContext';
import { TemplateDialog } from './templates/TemplateDialog';
import { FolderDialog } from './templates/FolderDialog';
import { PlaceholderEditor } from './templates/PlaceHolderEditor';
import { AuthDialog } from './auth/AuthDialog';
import { SettingsDialog } from './settings/SettingsDialog';
import { ConfirmationDialog } from './common/ConfirmationDialog';

/**
 * Main dialog provider that includes all dialog components
 * This component ensures window.dialogManager is available
 */
export const DialogProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Debug check to verify dialog manager initialization
  useEffect(() => {
    console.log('DialogProvider mounted, checking dialogManager availability');
    console.log('window.dialogManager available:', !!window.dialogManager);
    
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
    <DialogManagerProvider>
      {children}
      
      {/* Register all dialogs here */}
      <TemplateDialog />
      <FolderDialog />
      <PlaceholderEditor />
      <AuthDialog />
      <SettingsDialog />
      <ConfirmationDialog />
    </DialogManagerProvider>
  );
};

// Export individual components and hooks
export { DialogManagerProvider } from './core/DialogContext';
export { useDialog, useDialogManager, useOpenDialog } from './core/DialogContext';
export { TemplateDialog } from './templates/TemplateDialog';
export { FolderDialog } from './templates/FolderDialog';
export { PlaceholderEditor } from './templates/PlaceHolderEditor';
export { AuthDialog } from './auth/AuthDialog';
export { SettingsDialog } from './settings/SettingsDialog';
export { ConfirmationDialog } from './common/ConfirmationDialog';