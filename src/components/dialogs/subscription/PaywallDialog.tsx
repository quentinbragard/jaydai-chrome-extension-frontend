import React from 'react';
import { Button } from '@/components/ui/button';
import { BaseDialog } from '../BaseDialog';
import { useDialog, useDialogManager } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { getMessage } from '@/core/utils/i18n';

export const PaywallDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.PAYWALL);
  const { openDialog } = useDialogManager();

  const handleUpgrade = () => {
    dialogProps.onOpenChange(false);
    openDialog(DIALOG_TYPES.MANAGE_SUBSCRIPTION);
  };

  if (!isOpen) return null;

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title={getMessage('upgrade_required', undefined, 'Upgrade Required')}
      className="jd-max-w-md"
    >
      <div className="jd-space-y-4">
        <p>
          {getMessage(
            'paywall_message',
            undefined,
            'Free users can create up to 5 custom templates or blocks. Upgrade your subscription to add more.'
          )}
        </p>
        <div className="jd-flex jd-justify-end">
          <Button onClick={handleUpgrade}>
            {getMessage('upgrade_now', undefined, 'Upgrade Now')}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
};
