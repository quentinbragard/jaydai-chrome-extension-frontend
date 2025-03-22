// src/core/managers/DialogManagerProvider.tsx

import React, { ReactNode } from 'react';
import { useDialog } from '@/core/hooks/useDialog';
import SettingsDialog from '@/components/dialogs/SettingsDialog';
import TemplateDialog from '@/components/panels/TemplatesPanel/TemplateDialog';
import FolderDialog from '@/components/panels/TemplatesPanel/FolderDialog';
import PlaceholderEditor from '@/components/panels/TemplatesPanel/PlaceholderEditor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DialogManagerProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages all application dialogs
 * Ensures dialogs are rendered at the root level to prevent z-index issues
 */
export const DialogManagerProvider: React.FC<DialogManagerProviderProps> = ({ children }) => {
  // Settings dialog
  const settingsDialog = useDialog('settings');
  
  // Template dialogs
  const createTemplateDialog = useDialog('createTemplate');
  const editTemplateDialog = useDialog('editTemplate');
  
  // Folder dialog
  const createFolderDialog = useDialog('createFolder');
  
  // Placeholder editor
  const placeholderEditorDialog = useDialog('placeholderEditor');
  
  // Confirmation dialog
  const confirmationDialog = useDialog('confirmation');
  const confirmationData = confirmationDialog.data || { 
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: () => {},
  };

  return (
    <>
      {children}

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsDialog.isOpen}
        onOpenChange={settingsDialog.dialogProps.onOpenChange}
      />

      {/* Template Dialog - both for create and edit */}
      {(createTemplateDialog.isOpen || editTemplateDialog.isOpen) && (
        <TemplateDialog
          open={createTemplateDialog.isOpen || editTemplateDialog.isOpen}
          onOpenChange={(open) => {
            if (createTemplateDialog.isOpen) {
              createTemplateDialog.dialogProps.onOpenChange(open);
            } else {
              editTemplateDialog.dialogProps.onOpenChange(open);
            }
          }}
          currentTemplate={editTemplateDialog.data?.template || null}
          formData={editTemplateDialog.data?.formData || createTemplateDialog.data?.formData || {}}
          onFormChange={editTemplateDialog.data?.onFormChange || createTemplateDialog.data?.onFormChange || (() => {})}
          onSaveTemplate={editTemplateDialog.data?.onSave || createTemplateDialog.data?.onSave || (() => {})}
          userFolders={editTemplateDialog.data?.userFolders || createTemplateDialog.data?.userFolders || []}
        />
      )}

      {/* Folder Dialog */}
      {createFolderDialog.isOpen && (
        <FolderDialog
          open={createFolderDialog.isOpen}
          onOpenChange={createFolderDialog.dialogProps.onOpenChange}
          onSaveFolder={createFolderDialog.data?.onSaveFolder || (() => Promise.resolve(true))}
        />
      )}

      {/* Placeholder Editor Dialog */}
      {placeholderEditorDialog.isOpen && (
        <PlaceholderEditor
          open={placeholderEditorDialog.isOpen}
          onOpenChange={placeholderEditorDialog.dialogProps.onOpenChange}
          templateContent={placeholderEditorDialog.data?.content || ''}
          templateTitle={placeholderEditorDialog.data?.title || 'Template'}
          onComplete={placeholderEditorDialog.data?.onComplete || (() => {})}
        />
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmationDialog.isOpen}
        onOpenChange={confirmationDialog.dialogProps.onOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmationData.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationData.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {confirmationData.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              confirmationData.onConfirm();
              confirmationDialog.closeDialog();
            }}>
              {confirmationData.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DialogManagerProvider;