import React, { ReactNode, createContext, useContext, useEffect } from 'react';
import { useDialog } from '@/core/hooks/useDialog';
import SettingsDialog from '@/components/dialogs/SettingsDialog';
import TemplateDialog from '@/components/panels/TemplatesPanel/TemplateDialog';
import FolderDialog from '@/components/panels/TemplatesPanel/FolderDialog';
import PlaceholderEditor from '@/components/panels/TemplatesPanel/PlaceholderEditor';
import { DEFAULT_FORM_DATA } from '@/types/templates';
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

// Create a context for the dialog manager to be globally accessible
export const DialogManagerContext = createContext(null);

// Create a hook to access the dialog manager
export function useDialogManager() {
  const context = useContext(DialogManagerContext);
  if (!context) {
    throw new Error("useDialogManager must be used within a DialogManagerProvider");
  }
  return context;
}

/**
 * Provider component that manages all application dialogs
 * Ensures dialogs are rendered at the root level to prevent z-index issues
 */
export const DialogManagerProvider: React.FC<{children: ReactNode}> = ({ children }) => {
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

  // Debug logging for dialog state changes
  useEffect(() => {
    if (createTemplateDialog.isOpen) {
      console.log('📝 Create Template Dialog opened with data:', createTemplateDialog.data);
    }
  }, [createTemplateDialog.isOpen, createTemplateDialog.data]);

  useEffect(() => {
    if (editTemplateDialog.isOpen) {
      console.log('✏️ Edit Template Dialog opened with data:', editTemplateDialog.data);
    }
  }, [editTemplateDialog.isOpen, editTemplateDialog.data]);

  // Create the value to be provided through the context
  const dialogManager = {
    openDialog: (dialogType: string, data?: any) => {
      console.log(`Opening dialog: ${dialogType}`, data);
      switch (dialogType) {
        case 'settings':
          settingsDialog.openDialog(data);
          break;
        case 'createTemplate':
          createTemplateDialog.openDialog(data);
          break;
        case 'editTemplate':
          editTemplateDialog.openDialog(data);
          break;
        case 'createFolder':
          createFolderDialog.openDialog(data);
          break;
        case 'placeholderEditor':
          placeholderEditorDialog.openDialog(data);
          break;
        case 'confirmation':
          confirmationDialog.openDialog(data);
          break;
        default:
          console.error(`Unknown dialog type: ${dialogType}`);
      }
    },
    closeDialog: (dialogType: string) => {
      console.log(`Closing dialog: ${dialogType}`);
      switch (dialogType) {
        case 'settings':
          settingsDialog.closeDialog();
          break;
        case 'createTemplate':
          createTemplateDialog.closeDialog();
          break;
        case 'editTemplate':
          editTemplateDialog.closeDialog();
          break;
        case 'createFolder':
          createFolderDialog.closeDialog();
          break;
        case 'placeholderEditor':
          placeholderEditorDialog.closeDialog();
          break;
        case 'confirmation':
          confirmationDialog.closeDialog();
          break;
        default:
          console.error(`Unknown dialog type: ${dialogType}`);
      }
    }
  };

  // Make the dialog manager globally accessible for components that can't use the context
  if (typeof window !== 'undefined') {
    window.dialogManager = dialogManager;
  }

  // Safely get template data and callbacks
  const getTemplateFormData = (dialog) => {
    if (!dialog || !dialog.data) return DEFAULT_FORM_DATA;
    return dialog.data.formData || DEFAULT_FORM_DATA;
  };

  const getFormChangeHandler = (dialog) => {
    if (!dialog || !dialog.data || typeof dialog.data.onFormChange !== 'function') {
      return (newData) => console.warn("No onFormChange provided");
    }
    return dialog.data.onFormChange;
  };

  const getSaveHandler = (dialog) => {
    if (!dialog || !dialog.data || typeof dialog.data.onSave !== 'function') {
      return () => console.warn("No onSave provided");
    }
    return dialog.data.onSave;
  };

  const getUserFolders = (dialog) => {
    if (!dialog || !dialog.data) return [];
    return dialog.data.userFolders || [];
  };

  return (
    <DialogManagerContext.Provider value={dialogManager}>
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
            console.log("Template dialog onOpenChange:", open);
            if (createTemplateDialog.isOpen) {
              createTemplateDialog.dialogProps.onOpenChange(open);
            } else {
              editTemplateDialog.dialogProps.onOpenChange(open);
            }
          }}
          currentTemplate={editTemplateDialog.isOpen ? editTemplateDialog.data?.template || null : null}
          formData={editTemplateDialog.isOpen 
            ? getTemplateFormData(editTemplateDialog) 
            : getTemplateFormData(createTemplateDialog)}
          onFormChange={editTemplateDialog.isOpen 
            ? getFormChangeHandler(editTemplateDialog)
            : getFormChangeHandler(createTemplateDialog)}
          onSaveTemplate={editTemplateDialog.isOpen 
            ? getSaveHandler(editTemplateDialog)
            : getSaveHandler(createTemplateDialog)}
          userFolders={editTemplateDialog.isOpen 
            ? getUserFolders(editTemplateDialog)
            : getUserFolders(createTemplateDialog)}
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
    </DialogManagerContext.Provider>
  );
};

// Add TypeScript interface for window to recognize the dialogManager property
declare global {
  interface Window {
    dialogManager: {
      openDialog: (dialogType: string, data?: any) => void;
      closeDialog: (dialogType: string) => void;
    };
  }
}

export default DialogManagerProvider;