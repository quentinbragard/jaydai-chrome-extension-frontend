// src/components/dialogs/index.tsx
import React from 'react';
import { DialogManager } from './DialogManager';

/**
 * Main dialog provider that includes all dialog components
 * This component ensures window.dialogManager is available
 */
export const DialogProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <DialogManager>
      {children}
    </DialogManager>
  );
};

// Export individual components and hooks
export { DialogContextProvider } from './DialogContext';
export { useDialog, useDialogManager } from './DialogContext';
export { CreateTemplateDialog as TemplateDialog } from './prompts/CreateTemplateDialog';
export { FolderDialog } from './prompts/CreateFolderDialog';
export { PlaceholderEditor } from './prompts/CustomizeTemplateDialog';
export { AuthDialog } from './auth/AuthDialog';
export { SettingsDialog } from './settings/SettingsDialog';
export { ConfirmationDialog } from './common/ConfirmationDialog';
export { EnhancedStatsDialog } from './analytics/EnhancedStatsDialog';
export { BaseDialog } from './BaseDialog';