// src/components/dialogs/index.tsx
import React from 'react';
import { DialogManagerProvider } from './core/DialogContext';
import { TemplateDialog } from './templates/TemplateDialog';
import { FolderDialog } from './templates/FolderDialog';
import { PlaceholderEditor } from './templates/PlaceholderEditor';
import { AuthDialog } from './auth/AuthDialog';
import { SettingsDialog } from './settings/SettingsDialog';
import { ConfirmationDialog } from './common/ConfirmationDialog';

/**
 * Main dialog provider that includes all dialog components
 */
export const DialogProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
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

// Export individual dialogs for direct usage
export { DialogManagerProvider } from './core/DialogContext';
export { useDialog, useDialogManager, useOpenDialog } from './core/DialogContext';
export { TemplateDialog } from './templates/TemplateDialog';
export { FolderDialog } from './templates/FolderDialog';
export { PlaceholderEditor } from './templates/PlaceholderEditor';
export { AuthDialog } from './auth/AuthDialog';
export { SettingsDialog } from './settings/SettingsDialog';
export { ConfirmationDialog } from './common/ConfirmationDialog';