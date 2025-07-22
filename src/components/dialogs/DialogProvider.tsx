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
import { BrowseMoreFoldersDialog } from './prompts/BrowseMoreFoldersDialog';
import { TutorialsDialog } from './tutorials/TutorialsDialog';
import { TutorialVideoDialog } from './tutorials/TutorialVideoDialog';
import { ManageSubscriptionDialog } from './subscription/ManageSubscriptionDialog';
import { PaywallDialog } from './subscription/PaywallDialog';
import { KeyboardShortcutDialog } from './onboarding/KeyboardShortcutDialog';
import { InformationDialog } from './onboarding/InformationDialog';
import { ShareDialog } from './share/ShareDialog';
import { ReferralShareDialog } from './share/ReferralShareDialog';


/**
 * Main dialog provider that includes all dialog components
 * This component ensures window.dialogManager is available
 */
export const DialogProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Debug check to verify dialog manager initialization
  useEffect(() => {
    
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
    }
    

    
  }, []);
  
  return (
    <DialogManagerProvider>
      {children}
      
      {/* Register all dialogs here */}
      <CreateTemplateDialog />
      <CreateFolderDialog />
      <FolderManagerDialog />
      <InsertBlockDialog />
      <CreateBlockDialog />
      <AuthDialog />
      <SettingsDialog />
      <ConfirmationDialog />
      <EnhancedStatsDialog />
      <BrowseMoreFoldersDialog />
      <TutorialsDialog />
      <TutorialVideoDialog />
      <PaywallDialog />
      <ManageSubscriptionDialog />
      <ReferralShareDialog />
      <InformationDialog />
      <KeyboardShortcutDialog />
      <ShareDialog />
      {/* Place the customize dialog last so it stacks above others */}
      <CustomizeTemplateDialog />
    </DialogManagerProvider>
  );
};