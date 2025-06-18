// src/components/dialogs/index.tsx
import React from 'react';
import { DialogProvider as DialogContextProvider } from './DialogContext';
import { CreateFolderDialog } from './prompts/CreateFolderDialog';
import { FolderManagerDialog } from './prompts/FolderManagerDialog';
import { UnifiedTemplateDialog } from './prompts/UnifiedTemplateDialog';
import { TemplateEditorProvider } from '@/contexts/TemplateEditorContext';
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
      <TemplateEditorProvider>
        <UnifiedTemplateDialog />
      </TemplateEditorProvider>
      <CreateFolderDialog  />
      <FolderManagerDialog />
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
export { UnifiedTemplateDialog as TemplateDialog } from './prompts/UnifiedTemplateDialog';
export { FolderDialog } from './prompts/CreateFolderDialog';
export { AuthDialog } from './auth/AuthDialog';
export { SettingsDialog } from './settings/SettingsDialog';
export { ConfirmationDialog } from './common/ConfirmationDialog';
export { EnhancedStatsDialog } from './analytics/EnhancedStatsDialog';
export { FolderManagerDialog } from './prompts/FolderManagerDialog';
export { BaseDialog } from './BaseDialog';