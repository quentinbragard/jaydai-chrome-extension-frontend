// src/components/dialogs/common/ConfirmationDialog.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { useDialog } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { getMessage } from '@/core/utils/i18n';
import { BaseDialog } from '../BaseDialog';

/**
 * Generic confirmation dialog component
 */
export const ConfirmationDialog: React.FC = () => {
  const { isOpen, data, dialogProps } = useDialog(DIALOG_TYPES.CONFIRMATION);
  
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
    dialogProps.onOpenChange(false);
  };
  
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancel();
    dialogProps.onOpenChange(false);
  };
  
  if (!isOpen) return null;
  
  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title={title}
      description={description}
      className="jd-max-w-md"
      baseZIndex={10060}
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