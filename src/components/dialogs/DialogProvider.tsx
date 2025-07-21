// src/components/dialogs/DialogProvider.tsx
import React, { useEffect } from 'react';
import { DialogManagerProvider } from './DialogContext';
import { CreateTemplateDialog } from '@/components/dialogs/prompts/CreateTemplateDialog';
import { CreateFolderDialog } from './prompts/CreateFolderDialog';
import { CustomizeTemplateDialog } from './prompts/CustomizeTemplateDialog';
import { AuthDialog } from './auth/AuthDialog';
import { SettingsDialog } from './settings/SettingsDialog';
import { ConfirmationDialog } from './common/ConfirmationDialog';
import { EnhancedStatsDialog } from './analytics/EnhancedStatsDialog';
import { InformationDialog } from './common/InformationDialog';

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
    
    // Listen for events in shadow DOM
    const handleCapturedEvent = (e: Event) => {
      // Don't intercept all events - let normal UI events continue
      // We only want to intercept keyboard events when dialogs are open
      if (document.querySelector('.jd-fixed.jd-inset-0.jd-z-50')) {
        if (
          e.type.startsWith('key') || 
          e.type === 'input' || 
          e.type === 'change' ||
          e.type === 'focus' || 
          e.type === 'blur'
        ) {
          e.stopPropagation();
        }
      }
    };
    
    // Events to capture
    const events = [
      'keydown', 'keyup', 'keypress', 
      'input', 'change', 'focus', 'blur'
    ];
    
    // Add event listeners in capture phase at the root level
    events.forEach(eventType => {
      document.addEventListener(eventType, handleCapturedEvent, true);
    });
    
    // Cleanup
    return () => {
      events.forEach(eventType => {
        document.removeEventListener(eventType, handleCapturedEvent, true);
      });
    };
  }, []);
  
  return (
    <DialogManagerProvider>
      {children}
      
      {/* Register all dialogs here */}
      <CreateTemplateDialog />
      <CreateFolderDialog  />
      <CustomizeTemplateDialog />
      <AuthDialog />
      <SettingsDialog />
      <ConfirmationDialog />
      <EnhancedStatsDialog />
      <InformationDialog />
    </DialogManagerProvider>
  );
};