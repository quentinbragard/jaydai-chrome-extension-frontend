// src/components/dialogs/common/ConfirmationDialog.tsx
import React from 'react';
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
import { useDialog } from '@/components/dialogs/core/DialogContext';
import { DIALOG_TYPES } from '@/core/dialogs/registry';

/**
 * Generic confirmation dialog component
 */
export const ConfirmationDialog: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.CONFIRMATION);
  
  // Safe extraction of dialog data with defaults
  const title = data?.title || 'Confirm Action';
  const description = data?.description || 'Are you sure you want to proceed?';
  const confirmText = data?.confirmText || 'Confirm';
  const cancelText = data?.cancelText || 'Cancel';
  const onConfirm = data?.onConfirm || (() => {});
  const onCancel = data?.onCancel || (() => {});
  
  const handleConfirm = () => {
    onConfirm();
    dialogProps.onOpenChange(false);
  };
  
  const handleCancel = () => {
    onCancel();
    dialogProps.onOpenChange(false);
  };
  
  if (!isOpen) return null;
  
  return (
    <AlertDialog open={isOpen} onOpenChange={dialogProps.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};