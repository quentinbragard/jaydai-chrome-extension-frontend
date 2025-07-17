// src/components/dialogs/subscription/ManageSubscriptionDialog.tsx - Fixed version
import React, { useState, useEffect, useRef } from 'react';
import { Crown, ExternalLink, AlertTriangle, CheckCircle, XCircle, RefreshCw, AlertCircle, Clock } from 'lucide-react';
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
import { useSubscription, useSubscriptionActions } from '@/state/SubscriptionContext';
import { PricingPlans } from '@/components/pricing/PricingPlans';

/**
 * Dialog for managing user subscription
 */
export const ManageSubscriptionDialog: React.FC = () => {
  const { isOpen, dialogProps } = useDialog(DIALOG_TYPES.MANAGE_SUBSCRIPTION);
  const { authState } = useAuthState();
  const { subscription, isLoading } = useSubscription();
  const { cancelSubscription, reactivateSubscription, refreshSubscription } = useSubscriptionActions();
  const [loading, setLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  
  // Use ref to track if we've already refreshed to avoid infinite loops
  const hasRefreshedRef = useRef(false);

  // Load subscription status when dialog opens - FIXED to avoid infinite loops
  useEffect(() => {
    if (isOpen && authState.user?.id && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      refreshSubscription().then(() => {
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
    if (isOpen && subscription && !subscription.isActive && !subscription.isTrialing) {
      setShowPricing(true);
    }
  }, [isOpen, subscription?.isActive, subscription?.isTrialing]);

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
    const confirmCancel = window.confirm(
      getMessage('confirm_cancel_subscription', undefined, 'Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')
    );

    if (!confirmCancel) return;

    setLoading(true);
    try {
      await cancelSubscription();
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setLoading(true);
    try {
      await reactivateSubscription();
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    setLoading(true);
    try {
      await refreshSubscription();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getPlanDisplayName = (planId: string | null) => {
    switch (planId) {
      case 'monthly':
        return getMessage('monthly_plan', undefined, 'Monthly Plan');
      case 'yearly':
        return getMessage('yearly_plan', undefined, 'Yearly Plan');
      case 'plus':
        return getMessage('plus_plan', undefined, 'Plus Plan');
      default:
        return getMessage('free_plan', undefined, 'Free Plan');
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: <CheckCircle className="jd-w-5 jd-h-5 jd-text-green-500" />,
          color: 'jd-bg-green-100 jd-text-green-800',
          label: getMessage('active', undefined, 'Active'),
          message: getMessage('active_subscription', undefined, 'Your subscription is active')
        };
      case 'trialing':
        return {
          icon: <Clock className="jd-w-5 jd-h-5 jd-text-blue-500" />,
          color: 'jd-bg-blue-100 jd-text-blue-800',
          label: getMessage('trial', undefined, 'Trial'),
          message: getMessage('trial_subscription', undefined, 'You are in your trial period')
        };
      case 'past_due':
        return {
          icon: <AlertTriangle className="jd-w-5 jd-h-5 jd-text-orange-500" />,
          color: 'jd-bg-orange-100 jd-text-orange-800',
          label: getMessage('past_due', undefined, 'Past Due'),
          message: getMessage('past_due_subscription', undefined, 'Your payment is overdue')
        };
      case 'cancelled':
        return {
          icon: <XCircle className="jd-w-5 jd-h-5 jd-text-red-500" />,
          color: 'jd-bg-red-100 jd-text-red-800',
          label: getMessage('cancelled', undefined, 'Cancelled'),
          message: getMessage('cancelled_subscription', undefined, 'Your subscription has been cancelled')
        };
      case 'incomplete':
        return {
          icon: <AlertCircle className="jd-w-5 jd-h-5 jd-text-yellow-500" />,
          color: 'jd-bg-yellow-100 jd-text-yellow-800',
          label: getMessage('incomplete', undefined, 'Incomplete'),
          message: getMessage('incomplete_subscription', undefined, 'Your subscription setup is incomplete')
        };
      default:
        return {
          icon: <XCircle className="jd-w-5 jd-h-5 jd-text-gray-500" />,
          color: 'jd-bg-gray-100 jd-text-gray-600',
          label: getMessage('inactive', undefined, 'Inactive'),
          message: getMessage('no_active_subscription', undefined, 'No active subscription')
        };
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

  const statusInfo = getStatusInfo(subscription?.subscription_status || 'inactive');

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
                    {statusInfo.icon}
                    <div>
                      <p className="jd-font-medium">
                        {getPlanDisplayName(subscription?.subscription_plan)}
                      </p>
                      <p className="jd-text-sm jd-text-muted-foreground">
                        {statusInfo.message}
                      </p>
                    </div>
                  </div>
                  
                  <Badge className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                </div>

                {/* Subscription Details */}
                {subscription?.hasSubscription && (
                  <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-4 jd-pt-4">
                    {subscription.isTrialing && subscription.trialEnd && (
                      <div className="jd-space-y-2">
                        <p className="jd-text-sm jd-text-muted-foreground">
                          {getMessage('trial_ends', undefined, 'Trial ends')}
                        </p>
                        <p className="jd-font-medium">
                          {formatDate(subscription.trialEnd)}
                        </p>
                      </div>
                    )}
                    
                    {(subscription.isActive || subscription.isTrialing) && subscription.currentPeriodEnd && (
                      <div className="jd-space-y-2">
                        <p className="jd-text-sm jd-text-muted-foreground">
                          {subscription.isTrialing 
                            ? getMessage('trial_period_end', undefined, 'Trial period ends')
                            : getMessage('next_billing_date', undefined, 'Next billing date')
                          }
                        </p>
                        <p className="jd-font-medium">
                          {formatDate(subscription.currentPeriodEnd)}
                        </p>
                      </div>
                    )}
                    
                    <div className="jd-space-y-2">
                      <p className="jd-text-sm jd-text-muted-foreground">
                        {getMessage('billing_status', undefined, 'Billing status')}
                      </p>
                      <p className="jd-font-medium">
                        {subscription.cancelAtPeriodEnd 
                          ? getMessage('cancelling_at_period_end', undefined, 'Cancelling at period end')
                          : subscription.isActive
                          ? getMessage('active_renewing', undefined, 'Active & renewing')
                          : subscription.isTrialing
                          ? getMessage('trial_period', undefined, 'Trial period')
                          : getMessage('inactive', undefined, 'Inactive')
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Warning Messages */}
                {subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
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

                {subscription?.isPastDue && (
                  <div className="jd-flex jd-items-start jd-space-x-2 jd-p-3 jd-bg-red-50 jd-border jd-border-red-200 jd-rounded-lg">
                    <AlertTriangle className="jd-w-5 jd-h-5 jd-text-red-600 jd-mt-0.5" />
                    <div>
                      <p className="jd-text-red-800 jd-text-sm jd-font-medium">
                        {getMessage('payment_overdue_title', undefined, 'Payment Overdue')}
                      </p>
                      <p className="jd-text-red-700 jd-text-sm">
                        {getMessage('payment_overdue_message', undefined, 'Your payment is overdue. Please update your payment method to continue using premium features.')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Action Buttons */}
            <div className="jd-space-y-3">
              {subscription?.isActive || subscription?.isTrialing ? (
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
              ) : subscription?.isCancelled && subscription.cancelAtPeriodEnd ? (
                <Button
                  onClick={handleReactivateSubscription}
                  disabled={loading || isLoading}
                  className="jd-w-full jd-flex jd-items-center jd-justify-center jd-space-x-2 jd-bg-green-600 hover:jd-bg-green-700"
                >
                  {loading ? (
                    <RefreshCw className="jd-w-4 jd-h-4 jd-animate-spin" />
                  ) : (
                    <Crown className="jd-w-4 jd-h-4" />
                  )}
                  <span>
                    {getMessage('reactivate_subscription', undefined, 'Reactivate Subscription')}
                  </span>
                </Button>
              ) : subscription?.isPastDue ? (
                <>
                  <Button
                    onClick={handleManageSubscription}
                    disabled={loading || isLoading}
                    className="jd-w-full jd-flex jd-items-center jd-justify-center jd-space-x-2 jd-bg-orange-600 hover:jd-bg-orange-700"
                  >
                    {loading ? (
                      <RefreshCw className="jd-w-4 jd-h-4 jd-animate-spin" />
                    ) : (
                      <ExternalLink className="jd-w-4 jd-h-4" />
                    )}
                    <span>
                      {getMessage('update_payment_method', undefined, 'Update Payment Method')}
                    </span>
                  </Button>
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
                onClick={handleRefreshSubscription}
                disabled={loading || isLoading}
                variant="ghost"
                size="sm"
                className="jd-text-muted-foreground hover:jd-text-foreground"
              >
                <RefreshCw className={`jd-w-4 jd-h-4 jd-mr-2 ${loading || isLoading ? 'jd-animate-spin' : ''}`} />
                {getMessage('refresh_status', undefined, 'Refresh Status')}
              </Button>
            </div>
          </>
        )}
      </div>
    </BaseDialog>
  );
};