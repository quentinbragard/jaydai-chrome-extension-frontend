import React from 'react';
import { BaseDialog } from '../BaseDialog';
import { useDialog, useDialogManager } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { getMessage } from '@/core/utils/i18n';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { PricingPlans } from '@/components/pricing/PricingPlans';
import { useThemeDetector } from '@/hooks/useThemeDetector';

export const PaywallDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.PAYWALL);
  const { openDialog } = useDialogManager();
  const { authState } = useAuthState();
  const isDark = useThemeDetector();
  const handlePaymentSuccess = () => {
    dialogProps.onOpenChange(false);
    openDialog(DIALOG_TYPES.MANAGE_SUBSCRIPTION);
  };

  const handlePaymentCancel = () => {
    // No-op for now
  };

  if (!isOpen) return null;

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={dialogProps.onOpenChange}
      title={getMessage('upgrade_required', undefined, 'Upgrade Required')}
      className="jd-max-w-2xl"
    >
      <div className="jd-space-y-2">
        <p className="jd-text-muted-foreground">
          {getMessage(
            'paywall_message',
            undefined,
            'Free users can create up to 5 custom templates or blocks. Upgrade your subscription to add more.'
          )}
        </p>
        {authState.user && (
          <PricingPlans
            user={authState.user}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentCancel={handlePaymentCancel}
            isDark={isDark}
          />
        )}
      </div>
    </BaseDialog>
  );
};
