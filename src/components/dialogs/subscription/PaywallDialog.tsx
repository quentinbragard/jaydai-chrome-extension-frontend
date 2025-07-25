import React, { useState, useEffect } from 'react';
import { BaseDialog } from '../BaseDialog';
import { trackEvent, EVENTS } from '@/utils/amplitude';
import { useDialog, useDialogManager } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { getMessage } from '@/core/utils/i18n';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { PricingPlans } from '@/components/pricing/PricingPlans';
import { useThemeDetector } from '@/hooks/useThemeDetector';
import { Button } from '@/components/ui/button';
import { Sparkles, Copy, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const PaywallDialog: React.FC = () => {
  const { isOpen, dialogProps, data } = useDialog(DIALOG_TYPES.PAYWALL);
  const { openDialog } = useDialogManager();
  const { authState } = useAuthState();
  const isDark = useThemeDetector();
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    trackEvent(EVENTS.PAYWALL_OPENED, { source: data?.reason });
    const handler = () => setShowPromo(true);
    window.addEventListener('referral-invite-sent', handler);
    return () => window.removeEventListener('referral-invite-sent', handler);
  }, []);

  const messageKey = React.useMemo(() => {
    switch (data?.reason) {
      case 'premiumTemplate':
        return 'paywall_premium_template_message';
      case 'templateLimit':
        return 'paywall_template_limit_message';
      case 'blockLimit':
        return 'paywall_block_limit_message';
      default:
        return 'paywall_message';
    }
  }, [data]);

  const defaultMessage = React.useMemo(() => {
    switch (data?.reason) {
      case 'premiumTemplate':
        return 'This template is only available to Premium users. Upgrade your subscription to access premium templates.';
      case 'templateLimit':
        return 'Free users can create up to 5 custom templates. Upgrade your subscription to add more.';
      case 'blockLimit':
        return 'Free users can create up to 5 blocks. Upgrade your subscription to add more.';
      default:
        return 'Free users can create up to 5 custom templates or blocks. Upgrade your subscription to add more.';
    }
  }, [data]);

  const handlePaymentSuccess = () => {
    if (authState.user) {
      trackEvent(EVENTS.PAYMENT_COMPLETED, { source: 'paywall_dialog', userId: authState.user.id });
    }
    dialogProps.onOpenChange(false);
    openDialog(DIALOG_TYPES.MANAGE_SUBSCRIPTION);
  };

  const handlePaymentCancel = () => {
    if (authState.user) {
      trackEvent(EVENTS.PAYMENT_CANCELLED, { source: 'paywall_dialog', userId: authState.user.id });
    }
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
          {getMessage(messageKey, undefined, defaultMessage)}
        </p>
        {showPromo ? (
          <>
            <div className="jd-text-center jd-space-y-4">
              <div className="jd-flex jd-items-center jd-justify-center jd-gap-2">
                <span className="jd-font-mono jd-text-lg">JAYDAI-REFERRER-10</span>
                <Button size="icon" variant="ghost" onClick={async () => {
                  try {
                    await navigator.clipboard.writeText('JAYDAI-REFERRER-10');
                    toast.success(getMessage('copiedToClipboard', undefined, 'Copied to clipboard'));
                  } catch (error) {
                    toast.error(getMessage('copyFailed', undefined, 'Failed to copy to clipboard'));
                  }
                }}>
                  <Copy className="jd-w-4 jd-h-4" />
                </Button>
              </div>
            </div>
            <div className="jd-flex jd-justify-center jd-pt-2">
              <Button variant="outline" onClick={() => setShowPromo(false)}>
                <ArrowLeft className="jd-w-4 jd-h-4 jd-mr-2" />
                {getMessage('back_to_plans', undefined, 'Back to plans')}
              </Button>
            </div>
          </>
        ) : (
          <>
          <div className="jd-flex jd-justify-center jd-pt-4">
              <Button variant="secondary" onClick={() => openDialog(DIALOG_TYPES.REFERRAL_SHARE)}>
                <Sparkles className="jd-w-4 jd-h-4 jd-mr-2" />
                {getMessage('get_discount_promo', undefined, 'Invite a friend and get -10%')}
              </Button>
            </div>
            {authState.user && (
              <PricingPlans
                user={authState.user}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentCancel={handlePaymentCancel}
                isDark={isDark}
              />
            )}
          </>
        )}
      </div>
    </BaseDialog>
  );
};
