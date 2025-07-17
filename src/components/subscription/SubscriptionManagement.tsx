// src/components/subscription/SubscriptionManagement.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getMessage } from '@/core/utils/i18n';
import { stripeApi } from '@/services/api/StripeApi';
import { getCustomerPortalUrl } from '@/utils/stripeUtils';
import { SubscriptionStatus } from '@/types/stripe';
import { User } from '@/types';

interface SubscriptionManagementProps {
  user: User;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ user }) => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load subscription status on mount
  useEffect(() => {
    loadSubscriptionStatus();
  }, [user.id]);

  const loadSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      const status = await stripeApi.getSubscriptionStatus(user.id);
      setSubscription(status);
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast.error(getMessage('errorLoadingSubscription', undefined, 'Failed to load subscription status'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsUpdating(true);
      const portalUrl = await getCustomerPortalUrl(user.id);
      
      if (portalUrl) {
        window.open(portalUrl, '_blank');
        toast.info(getMessage('redirectingToPortal', undefined, 'Opening subscription management in new tab'));
      } else {
        toast.error(getMessage('errorOpeningPortal', undefined, 'Unable to open subscription management'));
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error(getMessage('errorOpeningPortal', undefined, 'Unable to open subscription management'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm(getMessage('confirmCancelSubscription', undefined, 'Are you sure you want to cancel your subscription?'))) {
      return;
    }

    try {
      setIsUpdating(true);
      const success = await stripeApi.cancelSubscription(user.id);
      
      if (success) {
        toast.success(getMessage('subscriptionCancelled', undefined, 'Subscription cancelled successfully'));
        await loadSubscriptionStatus(); // Reload status
      } else {
        toast.error(getMessage('errorCancellingSubscription', undefined, 'Failed to cancel subscription'));
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(getMessage('errorCancellingSubscription', undefined, 'Failed to cancel subscription'));
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getPlanDisplayName = (planId: string | null) => {
    switch (planId) {
      case 'monthly':
        return getMessage('monthlyPlan', undefined, 'Monthly Plan');
      case 'yearly':
        return getMessage('yearlyPlan', undefined, 'Yearly Plan');
      default:
        return getMessage('freePlan', undefined, 'Free Plan');
    }
  };

  if (isLoading) {
    return (
      <Card className="jd-bg-gray-900 jd-border-gray-800">
        <CardContent className="jd-p-6">
          <div className="jd-flex jd-items-center jd-justify-center jd-space-x-2">
            <RefreshCw className="jd-w-4 jd-h-4 jd-animate-spin" />
            <span className="jd-text-gray-400">
              {getMessage('loadingSubscription', undefined, 'Loading subscription status...')}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="jd-bg-gray-900 jd-border-gray-800">
        <CardHeader>
          <CardTitle className="jd-flex jd-items-center jd-space-x-2 jd-text-white">
            <Crown className="jd-w-5 jd-h-5" />
            <span>{getMessage('subscription', undefined, 'Subscription')}</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="jd-space-y-6">
          {/* Current Plan Status */}
          <div className="jd-flex jd-items-center jd-justify-between jd-p-4 jd-bg-gray-800 jd-rounded-lg">
            <div className="jd-flex jd-items-center jd-space-x-3">
              {subscription?.isActive ? (
                <CheckCircle className="jd-w-5 jd-h-5 jd-text-green-400" />
              ) : (
                <XCircle className="jd-w-5 jd-h-5 jd-text-gray-400" />
              )}
              
              <div>
                <p className="jd-font-medium jd-text-white">
                  {getPlanDisplayName(subscription?.planId)}
                </p>
                <p className="jd-text-sm jd-text-gray-400">
                  {subscription?.isActive 
                    ? getMessage('activeSubscription', undefined, 'Active subscription')
                    : getMessage('noActiveSubscription', undefined, 'No active subscription')
                  }
                </p>
              </div>
            </div>
            
            <Badge 
              variant={subscription?.isActive ? "default" : "secondary"}
              className={`${subscription?.isActive 
                ? 'jd-bg-green-600 jd-text-white' 
                : 'jd-bg-gray-700 jd-text-gray-300'
              }`}
            >
              {subscription?.isActive 
                ? getMessage('active', undefined, 'Active')
                : getMessage('inactive', undefined, 'Inactive')
              }
            </Badge>
          </div>

          {/* Subscription Details */}
          {subscription?.isActive && (
            <div className="jd-space-y-4">
              <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-4">
                <div className="jd-flex jd-items-center jd-space-x-2">
                  <Calendar className="jd-w-4 jd-h-4 jd-text-gray-400" />
                  <div>
                    <p className="jd-text-sm jd-text-gray-400">
                      {getMessage('renewalDate', undefined, 'Next billing date')}
                    </p>
                    <p className="jd-text-white">
                      {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                </div>
                
                <div className="jd-flex jd-items-center jd-space-x-2">
                  <CreditCard className="jd-w-4 jd-h-4 jd-text-gray-400" />
                  <div>
                    <p className="jd-text-sm jd-text-gray-400">
                      {getMessage('billingStatus', undefined, 'Billing status')}
                    </p>
                    <p className="jd-text-white">
                      {subscription.cancelAtPeriodEnd 
                        ? getMessage('cancellingAtPeriodEnd', undefined, 'Cancelling at period end')
                        : getMessage('activeRenewing', undefined, 'Active & renewing')
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Cancellation Warning */}
              {subscription.cancelAtPeriodEnd && (
                <div className="jd-flex jd-items-start jd-space-x-2 jd-p-3 jd-bg-yellow-900/30 jd-border jd-border-yellow-700/50 jd-rounded-lg">
                  <AlertTriangle className="jd-w-5 jd-h-5 jd-text-yellow-400 jd-mt-0.5" />
                  <div>
                    <p className="jd-text-yellow-300 jd-text-sm jd-font-medium">
                      {getMessage('subscriptionCancellingTitle', undefined, 'Subscription Cancelling')}
                    </p>
                    <p className="jd-text-yellow-200 jd-text-sm">
                      {getMessage('subscriptionCancellingMessage', undefined, 'Your subscription will end on {0}. You\'ll continue to have access until then.')
                        .replace('{0}', formatDate(subscription.currentPeriodEnd))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="jd-flex jd-flex-col jd-space-y-3">
            {subscription?.isActive ? (
              <>
                <Button
                  onClick={handleManageSubscription}
                  disabled={isUpdating}
                  className="jd-w-full jd-bg-blue-600 hover:jd-bg-blue-700"
                >
                  {isUpdating ? (
                    <RefreshCw className="jd-w-4 jd-h-4 jd-animate-spin jd-mr-2" />
                  ) : (
                    <ExternalLink className="jd-w-4 jd-h-4 jd-mr-2" />
                  )}
                  {getMessage('manageSubscription', undefined, 'Manage Subscription')}
                </Button>

                {!subscription.cancelAtPeriodEnd && (
                  <Button
                    onClick={handleCancelSubscription}
                    disabled={isUpdating}
                    variant="outline"
                    className="jd-w-full jd-border-red-600 jd-text-red-400 hover:jd-bg-red-900/20"
                  >
                    {getMessage('cancelSubscription', undefined, 'Cancel Subscription')}
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={() => {
                  // Navigate to pricing or open upgrade flow
                  toast.info(getMessage('redirectingToUpgrade', undefined, 'Opening upgrade options'));
                }}
                className="jd-w-full jd-bg-green-600 hover:jd-bg-green-700"
              >
                <Crown className="jd-w-4 jd-h-4 jd-mr-2" />
                {getMessage('upgradeToPremium', undefined, 'Upgrade to Premium')}
              </Button>
            )}
          </div>

          {/* Refresh Button */}
          <Button
            onClick={loadSubscriptionStatus}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="jd-w-full jd-text-gray-400 hover:jd-text-white"
          >
            <RefreshCw className={`jd-w-4 jd-h-4 jd-mr-2 ${isLoading ? 'jd-animate-spin' : ''}`} />
            {getMessage('refreshStatus', undefined, 'Refresh Status')}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};