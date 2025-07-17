// src/components/dialogs/subscription/ManageSubscriptionDialog.tsx

import React, { useState, useEffect } from 'react';
import { Crown, ExternalLink, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { BaseDialog } from '../BaseDialog';
import { useDialog } from '../DialogContext';
import { DIALOG_TYPES } from '../DialogRegistry';
import { getMessage } from '@/core/utils/i18n';
import { stripeService } from '@/services/stripe/StripeService';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { useSubscription } from '@/state/SubscriptionContext';
import { PricingPlans } from '@/components/pricing/PricingPlans';

/**
 * Dialog for managing user subscription
 */
export const ManageSubscriptionDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.MANAGE_SUBSCRIPTION);
  const { authState } = useAuthState();
  const { subscription, isLoading, refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  // Load subscription status when dialog opens
  useEffect(() => {
    if (isOpen && authState.user?.id) {
      refreshSubscription().then(() => {
        if (subscription && subscription.subscription_status !== 'active') {
          setShowPricing(true);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, authState.user?.id]);

  const handleManageSubscription = async () => {
    if (!authState.user?.id) return;

    try {
      setLoading(true);
      const portalUrl = await stripeService.getCustomerPortalUrl(authState.user.id);
      
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

  const handleCancelSubscription = async () => {
    if (!authState.user?.id) return;

    const confirmCancel = window.confirm(
      getMessage('confirm_cancel_subscription', undefined, 'Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')
    );

    if (!confirmCancel) return;

    try {
      setLoading(true);
      const success = await stripeService.cancelSubscription(authState.user.id);
      
      if (success) {
        toast.success(getMessage('subscription_cancelled', undefined, 'Subscription cancelled successfully'));
        await refreshSubscription();
        if (subscription && subscription.subscription_status !== 'active') {
          setShowPricing(true);
        }
      } else {
        toast.error(getMessage('error_cancelling_subscription', undefined, 'Failed to cancel subscription'));
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(getMessage('error_cancelling_subscription', undefined, 'Failed to cancel subscription'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getPlanDisplayName = (planId: string | null) => {
    switch (planId) {
      case 'monthly':
        return getMessage('monthly_plan', undefined, 'Monthly Plan');
      case 'yearly':
        return getMessage('yearly_plan', undefined, 'Yearly Plan');
      default:
        return getMessage('free_plan', undefined, 'Free Plan');
    }
  };

  const handlePaymentSuccess = () => {
    toast.success(getMessage('payment_successful', undefined, 'Payment successful! Your subscription is now active.'));
    refreshSubscription();
    setShowPricing(false);
  };

  const handlePaymentCancel = () => {
    toast.info(getMessage('payment_cancelled', undefined, 'Payment cancelled.'));
  };

  if (!isOpen) return null;

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
            <div className="jd-text-center jd-mb-6">
              <h3 className="jd-text-lg jd-font-semibold jd-mb-2">
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
            />
            
            <div className="jd-flex jd-justify-center jd-pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPricing(false)}
                disabled={loading || isLoading}
              >
                {getMessage('back_to_subscription', undefined, 'Back to Subscription')}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Current Subscription Status */}
            <Card>
              <CardHeader>
                <CardTitle className="jd-flex jd-items-center jd-space-x-2">
                  <Crown className="jd-w-5 jd-h-5" />
                  <span>{getMessage('current_subscription', undefined, 'Current Subscription')}</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="jd-space-y-4">
                <div className="jd-flex jd-items-center jd-justify-between jd-p-4 jd-bg-muted jd-rounded-lg">
                  <div className="jd-flex jd-items-center jd-space-x-3">
                    {subscription?.subscription_status === 'active' ? (
                      <CheckCircle className="jd-w-5 jd-h-5 jd-text-green-500" />
                    ) : (
                      <XCircle className="jd-w-5 jd-h-5 jd-text-muted-foreground" />
                    )}
                    
                    <div>
                      <p className="jd-font-medium">
                        {getPlanDisplayName(subscription?.subscription_plan)}
                      </p>
                      <p className="jd-text-sm jd-text-muted-foreground">
                        {subscription?.subscription_status === 'active' 
                          ? getMessage('active_subscription', undefined, 'Active subscription')
                          : getMessage('no_active_subscription', undefined, 'No active subscription')
                        }
                      </p>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={subscription?.subscription_status === 'active' ? "default" : "secondary"}
                    className={subscription?.subscription_status === 'active' 
                      ? 'jd-bg-green-100 jd-text-green-800' 
                      : 'jd-bg-gray-100 jd-text-gray-600'
                    }
                  >
                    {subscription?.subscription_status === 'active' 
                      ? getMessage('active', undefined, 'Active')
                      : getMessage('inactive', undefined, 'Inactive')
                    }
                  </Badge>
                </div>

                {subscription?.subscription_status === 'active' && (
                  <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-4 jd-pt-4">
                    <div className="jd-space-y-2">
                      <p className="jd-text-sm jd-text-muted-foreground">
                        {getMessage('next_billing_date', undefined, 'Next billing date')}
                      </p>
                      <p className="jd-font-medium">
                        {formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </div>
                    
                    <div className="jd-space-y-2">
                      <p className="jd-text-sm jd-text-muted-foreground">
                        {getMessage('billing_status', undefined, 'Billing status')}
                      </p>
                      <p className="jd-font-medium">
                        {subscription.cancelAtPeriodEnd 
                          ? getMessage('cancelling_at_period_end', undefined, 'Cancelling at period end')
                          : getMessage('active_renewing', undefined, 'Active & renewing')
                        }
                      </p>
                    </div>
                  </div>
                )}

                {subscription?.subscription_status === 'active' && subscription.cancelAtPeriodEnd && (
                  <div className="jd-flex jd-items-start jd-space-x-2 jd-p-3 jd-bg-yellow-50 jd-border jd-border-yellow-200 jd-rounded-lg">
                    <AlertTriangle className="jd-w-5 jd-h-5 jd-text-yellow-600 jd-mt-0.5" />
                    <div>
                      <p className="jd-text-yellow-800 jd-text-sm jd-font-medium">
                        {getMessage('subscription_cancelling_title', undefined, 'Subscription Cancelling')}
                      </p>
                      <p className="jd-text-yellow-700 jd-text-sm">
                        {getMessage('subscription_cancelling_message', undefined, 'Your subscription will end on {0}. You\'ll continue to have access until then.')
                          .replace('{0}', formatDate(subscription.currentPeriodEnd))}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Action Buttons */}
            <div className="jd-space-y-3">
              {subscription?.subscription_status === 'active' ? (
                <>
                  <Button
                    onClick={handleManageSubscription}
                    disabled={loading || isLoading}
                    className="jd-w-full jd-flex jd-items-center jd-justify-center jd-space-x-2"
                  >
                    {loading ? (
                      <RefreshCw className="jd-w-4 jd-h-4 jd-animate-spin" />
                    ) : (
                      <ExternalLink className="jd-w-4 jd-h-4" />
                    )}
                    <span>
                      {getMessage('manage_billing', undefined, 'Manage Billing & Payment')}
                    </span>
                  </Button>

                  {!subscription.cancelAtPeriodEnd && (
                    <Button
                      onClick={handleCancelSubscription}
                      disabled={loading || isLoading}
                      variant="outline"
                      className="jd-w-full jd-text-red-600 jd-border-red-600 hover:jd-bg-red-50"
                    >
                      {getMessage('cancel_subscription', undefined, 'Cancel Subscription')}
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={() => setShowPricing(true)}
                  className="jd-w-full jd-flex jd-items-center jd-justify-center jd-space-x-2 jd-bg-green-600 hover:jd-bg-green-700"
                >
                  <Crown className="jd-w-4 jd-h-4" />
                  <span>
                    {getMessage('upgrade_to_premium', undefined, 'Upgrade to Premium')}
                  </span>
                </Button>
              )}
            </div>

            {/* Refresh Button */}
            <div className="jd-flex jd-justify-center jd-pt-4">
              <Button
                onClick={() => refreshSubscription()}
                disabled={loading || isLoading}
                variant="ghost"
                size="sm"
                className="jd-text-muted-foreground hover:jd-text-foreground"
              >
                <RefreshCw className={`jd-w-4 jd-h-4 jd-mr-2 ${loading ? 'jd-animate-spin' : ''}`} />
                {getMessage('refresh_status', undefined, 'Refresh Status')}
              </Button>
            </div>
          </>
        )}
      </div>
    </BaseDialog>
  );
};