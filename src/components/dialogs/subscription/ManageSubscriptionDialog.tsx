// src/components/dialogs/subscription/ManageSubscriptionDialog.tsx - Fixed version
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Sparkles, Copy, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { BaseDialog } from '../BaseDialog';
import { useDialog, useDialogManager } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { getMessage } from '@/core/utils/i18n';
import { stripeApi } from '@/services/api/StripeApi';
import { buildReturnUrl } from '@/utils/stripe';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { useSubscriptionStatus } from '@/hooks/subscription/useSubscriptionStatus';
import { PricingPlans } from '@/components/pricing/PricingPlans';
import {
  getStatusInfo,
  SubscriptionStatusCard,
  ActionButtons,
} from './manage';
import { useThemeDetector } from '@/hooks/useThemeDetector';

/**
 * Dialog for managing user subscription
 */
export const ManageSubscriptionDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.MANAGE_SUBSCRIPTION);
  const { openDialog } = useDialogManager();
  const { authState } = useAuthState();
  const { subscription, loading: isLoading, refreshStatus } = useSubscriptionStatus();
  const [loading, setLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const isDark = useThemeDetector();
  // Use ref to track if we've already refreshed to avoid infinite loops
  const hasRefreshedRef = useRef(false);

  // Load subscription status when dialog opens - FIXED to avoid infinite loops
  useEffect(() => {
    if (isOpen && authState.user?.id && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      refreshStatus().then(() => {
        // Show pricing if user has no active subscription
        // We'll handle this in a separate effect to avoid dependency issues
      });
    }
    
    // Reset the ref when dialog closes
    if (!isOpen) {
      hasRefreshedRef.current = false;
    }
  }, [isOpen, authState.user?.id]); // Removed refreshSubscription from dependencies

  // Separate effect to handle showing pricing based on subscription status
  useEffect(() => {
    if (isOpen && subscription && subscription.status !== 'active' && subscription.status !== 'trialing') {
      setShowPricing(true);
    }
  }, [isOpen, subscription?.status]);

  // Listen for invite sent events from the share dialog
  useEffect(() => {
    const handler = () => setShowPromo(true);
    window.addEventListener('invite-sent', handler);
    return () => window.removeEventListener('invite-sent', handler);
  }, []);

  const handleManageSubscription = async () => {
    if (!authState.user?.id) return;

    try {
      setLoading(true);
      const portalUrl = await stripeApi.getCustomerPortalUrl(
        authState.user.id,
        await buildReturnUrl('success')
      );
      
      if (portalUrl) {
        window.open(portalUrl, '_blank');
        toast.info(getMessage('redirecting_to_portal', undefined, 'Opening subscription management in new tab'));
      } else {
        toast.error(getMessage('error_opening_portal', undefined, 'Unable to open subscription management'));
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error(getMessage('error_opening_portal', undefined, 'Unable to open subscription management'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    openDialog(DIALOG_TYPES.CONFIRMATION, {
      title: getMessage('cancel_subscription', undefined, 'Cancel Subscription'),
      description: getMessage(
        'confirm_cancel_subscription',
        undefined,
        'Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.'
      ),
      confirmText: getMessage('confirm', undefined, 'Confirm'),
      cancelText: getMessage('cancel', undefined, 'Cancel'),
      onConfirm: async () => {
        if (!authState.user?.id) return;

        setLoading(true);
        try {
          const success = await stripeApi.cancelSubscription(authState.user.id);
          if (success) {
            await refreshStatus();
            toast.success(getMessage('subscription_cancelled', undefined, 'Subscription cancelled successfully'));
          } else {
            toast.error(getMessage('error_cancelling_subscription', undefined, 'Failed to cancel subscription'));
          }
        } catch (error) {
          console.error('Error cancelling subscription:', error);
          toast.error(getMessage('error_cancelling_subscription', undefined, 'Failed to cancel subscription'));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleReactivateSubscription = async () => {
    if (!authState.user?.id) return;

    setLoading(true);
    try {
      const success = await stripeApi.reactivateSubscription(authState.user.id);
      if (success) {
        await refreshStatus();
        toast.success(getMessage('subscription_reactivated', undefined, 'Subscription reactivated successfully'));
      } else {
        toast.error(getMessage('error_reactivating_subscription', undefined, 'Failed to reactivate subscription'));
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error(getMessage('error_reactivating_subscription', undefined, 'Failed to reactivate subscription'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    setLoading(true);
    try {
      await refreshStatus();
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success(getMessage('payment_successful', undefined, 'Payment successful! Your subscription is now active.'));
    refreshStatus();
    setShowPricing(false);
  };

  const handlePaymentCancel = () => {
    toast.info(getMessage('payment_cancelled', undefined, 'Payment cancelled.'));
  };

  if (!isOpen) return null;

  const statusInfo = getStatusInfo(subscription?.status || 'inactive');

  return (
    <BaseDialog 
      {...dialogProps}
      title={getMessage('manage_subscription', undefined, 'Manage Subscription')}
      className="jd-max-w-2xl"
    >
      <div className="jd-space-y-6">
        {(loading || isLoading) && !subscription ? (
          <div className="jd-flex jd-items-center jd-justify-center jd-py-8">
            <RefreshCw className="jd-w-6 jd-h-6 jd-animate-spin jd-mr-2" />
            <span className="jd-text-muted-foreground">
              {getMessage('loading_subscription', undefined, 'Loading subscription status...')}
            </span>
          </div>
        ) : showPricing ? (
          <>
            {showPromo ? (
              <>
                <div className="jd-text-center jd-space-y-4">
                  <h3 className="jd-text-xl jd-font-semibold">
                    {getMessage('your_promo_code', undefined, 'Your promo code')}
                  </h3>
                  <div className="jd-flex jd-items-center jd-justify-center jd-gap-2">
                    <span className="jd-font-mono jd-text-lg">JAYDAI-REFERRER-10</span>
                    <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText('JAYDAI-REFERRER-10') && toast.success(getMessage('copied', undefined, 'Copied'))}>
                      <Copy className="jd-w-4 jd-h-4" />
                    </Button>
                  </div>
                </div>

                <div className="jd-flex jd-justify-center jd-pt-4">
                  <Button variant="outline" onClick={() => setShowPromo(false)}>
                    <ArrowLeft className="jd-w-4 jd-h-4 jd-mr-2" />
                    {getMessage('back_to_plans', undefined, 'Back to plans')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="jd-text-center jd-mb-6">
                  <h3 className="jd-text-2xl jd-font-semibold jd-mb-2">
                    {getMessage('upgrade_to_premium', undefined, 'Upgrade to Premium')}
                  </h3>
                  <p className="jd-text-muted-foreground">
                    {getMessage('unlock_premium_features', undefined, 'Unlock all premium features and get the most out of Jaydai')}
                  </p>
                </div>

                <PricingPlans
                  user={authState.user!}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentCancel={handlePaymentCancel}
                  isDark={isDark}
                />

                <div className="jd-flex jd-flex-col jd-items-center jd-gap-3 jd-pt-4">
                  <Button variant="ghost" onClick={() => openDialog(DIALOG_TYPES.SHARE)}>
                    <Sparkles className="jd-w-4 jd-h-4 jd-mr-2" />
                    {getMessage('get_discount_promo', undefined, 'Invite a friend and get -10%')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPricing(false)}
                    disabled={loading || isLoading}
                  >
                    {getMessage('back_to_subscription', undefined, 'Back to Subscription')}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {subscription && (
              <SubscriptionStatusCard subscription={subscription} statusInfo={statusInfo} />
            )}

            <Separator />

            <ActionButtons
              subscription={subscription}
              loading={loading}
              isLoading={isLoading}
              onManage={handleManageSubscription}
              onCancel={handleCancelSubscription}
              onReactivate={handleReactivateSubscription}
              onRefresh={handleRefreshSubscription}
              onUpgrade={() => setShowPricing(true)}
            />
          </>
        )}
      </div>
    </BaseDialog>
  );
};