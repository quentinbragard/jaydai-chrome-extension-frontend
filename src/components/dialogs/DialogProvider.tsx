// src/components/dialogs/DialogProvider.tsx
import React, { useEffect } from 'react';
import { DialogManagerProvider } from './DialogContext';
import { CreateTemplateDialog } from '@/components/dialogs/prompts/CreateTemplateDialog';
import { CreateFolderDialog } from './prompts/CreateFolderDialog';
import { CustomizeTemplateDialog } from './prompts/CustomizeTemplateDialog';
import { FolderManagerDialog } from './prompts/FolderManagerDialog';
import { CreateBlockDialog } from './prompts/CreateBlockDialog';
import { InsertBlockDialog } from './prompts/InsertBlockDialog';
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
  useEffect(() => {
    console.log('DialogProvider mounted, checking dialogManager availability');
    
    // Attempt to initialize dialog manager if it doesn't exist
    if (!window.dialogManager) {
      console.warn('Dialog manager not found, will try to initialize from DialogProvider');
      
      // Create a temporary placeholder until the real one is initialized
      window.dialogManager = {
        openDialog: (type, data) => {
          console.warn(`Attempted to open dialog ${type} before initialization is complete.`);
          // Queue this operation for after initialization
          setTimeout(() => {
            if (window.dialogManager?.isInitialized) {
              console.log(`Executing queued dialog open for ${type}`);
              window.dialogManager.openDialog(type, data);
            } else {
              console.error(`Failed to open dialog ${type}: dialog manager still not initialized.`);
            }
          }, 100);
        },
        closeDialog: (type) => {
          console.warn(`Attempted to close dialog ${type} before initialization is complete.`);
        },
        isInitialized: false
      };
    } else {
      console.log('window.dialogManager already available:', window.dialogManager);
    }
    

    
  }, []);
  
  return (
    <DialogManagerProvider>
      {children}
      
      {/* Register all dialogs here */}
      <CreateTemplateDialog />
      <CreateFolderDialog />
      <FolderManagerDialog />
      <CustomizeTemplateDialog />
      <CreateBlockDialog />
      <InsertBlockDialog />
      <AuthDialog />
      <SettingsDialog />
      <ConfirmationDialog />
      <EnhancedStatsDialog />
    </DialogManagerProvider>
  );
};