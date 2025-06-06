// src/components/dialogs/common/ConfirmationDialog.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { DIALOG_TYPES } from '../DialogRegistry';
import { useDialogStore } from '@/store/dialogStore';
import { getMessage } from '@/core/utils/i18n';
import { BaseDialog } from '../BaseDialog';

/**
 * Generic confirmation dialog component
 */
export const ConfirmationDialog: React.FC = () => {
  const isOpen = useDialogStore(state => state[DIALOG_TYPES.CONFIRMATION].isOpen);
  const data = useDialogStore(state => state[DIALOG_TYPES.CONFIRMATION].data);
  const closeDialog = useDialogStore(state => state.closeDialog);
  
  // Safe extraction of dialog data with defaults
  const title = data?.title || getMessage('confirmAction', undefined, 'Confirm Action');
  const description = data?.description || getMessage('confirmActionDescription', undefined, 'Are you sure you want to proceed?');
  const confirmText = data?.confirmText || getMessage('confirm', undefined, 'Confirm');
  const cancelText = data?.cancelText || getMessage('cancel', undefined, 'Cancel');
  const onConfirm = data?.onConfirm || (() => {});
  const onCancel = data?.onCancel || (() => {});
  
  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConfirm();
    closeDialog(DIALOG_TYPES.CONFIRMATION);
  };
  
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancel();
    closeDialog(DIALOG_TYPES.CONFIRMATION);
  };
  
  if (!isOpen) return null;
  
  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeDialog(DIALOG_TYPES.CONFIRMATION);
      }}
      title={title}
      description={description}
      className="jd-max-w-md"
    >
      <div className="jd-flex jd-flex-col jd-space-y-4 jd-mt-4">
        <div className="jd-flex jd-justify-end jd-space-x-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {cancelText}
          </Button>
          <Button 
            onClick={handleConfirm}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
};