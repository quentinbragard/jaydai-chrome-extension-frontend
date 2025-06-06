import React from 'react';
import { CreateTemplateDialog } from './prompts/CreateTemplateDialog';
import { CreateFolderDialog } from './prompts/CreateFolderDialog';
import { CustomizeTemplateDialog } from './prompts/CustomizeTemplateDialog';
import { CreateBlockDialog } from './prompts/CreateBlockDialog';
import { InsertBlockDialog } from './prompts/InsertBlockDialog';
import { AuthDialog } from './auth/AuthDialog';
import { SettingsDialog } from './settings/SettingsDialog';
import { ConfirmationDialog } from './common/ConfirmationDialog';
import { EnhancedStatsDialog } from './analytics/EnhancedStatsDialog';
import { DialogManagerProvider } from './DialogContext';

export const DialogManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <DialogManagerProvider>
      {children}
      <CreateTemplateDialog />
      <CreateFolderDialog />
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
