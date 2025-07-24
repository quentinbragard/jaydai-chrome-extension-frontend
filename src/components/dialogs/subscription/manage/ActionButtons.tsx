import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Crown, XCircle } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';
import { SubscriptionStatus } from '@/types/subscription';
import { formatDate } from './helpers';

interface Props {
  subscription: SubscriptionStatus | null;
  loading: boolean;
  isLoading: boolean;
  onManage: () => void;
  onCancel: () => void;
  onReactivate: () => void;
  onRefresh: () => void;
  onUpgrade: () => void;
}

export const ActionButtons: React.FC<Props> = ({
  subscription,
  loading,
  isLoading,
  onManage,
  onCancel,
  onReactivate,
  onRefresh,
  onUpgrade,
}) => (
  <> 
    <div className="jd-space-y-3">
      {subscription?.cancelAtPeriodEnd ? (
        // Already cancelled - show info and option to reactivate
        <>
          {subscription.currentPeriodEnd && (
            <div className="jd-p-4 jd-bg-yellow-50 jd-border jd-border-yellow-200 jd-rounded-lg">
              <p className="jd-text-yellow-800 jd-text-sm jd-text-center">
                {subscription.status === 'trialing'
                  ? getMessage(
                      'trial_end_no_charge',
                      undefined,
                      "Your trial will end on {0}. You won't be charged."
                    ).replace('{0}', formatDate(subscription.currentPeriodEnd))
                  : getMessage(
                      'subscription_already_cancelled',
                      undefined,
                      'Your subscription has been cancelled and will remain active until {0}. You will not be charged again.'
                    ).replace('{0}', formatDate(subscription.currentPeriodEnd))}
              </p>
            </div>
          )}

          <Button
            onClick={onReactivate}
            disabled={loading || isLoading}
            className="jd-w-full jd-flex jd-items-center jd-justify-center jd-space-x-2 jd-bg-green-600 hover:jd-bg-green-700"
          >
            {loading ? (
              <RefreshCw className="jd-w-4 jd-h-4 jd-animate-spin" />
            ) : (
              <Crown className="jd-w-4 jd-h-4" />
            )}
            <span>{getMessage('reactivate_subscription', undefined, 'Reactivate Subscription')}</span>
          </Button>
        </>
      ) : subscription?.status === 'active' ? (
        // Active subscription - show manage and cancel options
        <>
          <Button
            onClick={onManage}
            disabled={loading || isLoading}
            className="jd-w-full jd-flex jd-items-center jd-justify-center jd-space-x-2"
          >
            {loading ? (
              <RefreshCw className="jd-w-4 jd-h-4 jd-animate-spin" />
            ) : (
              <ExternalLink className="jd-w-4 jd-h-4" />
            )}
            <span>{getMessage('manage_billing', undefined, 'Manage Billing & Payment')}</span>
          </Button>

        {subscription.status !== 'cancelled' && subscription.status !== 'inactive' && subscription.status !== 'past_due' && (
            <Button
              onClick={onCancel}
              disabled={loading || isLoading}
              variant="outline"
              className="jd-w-full jd-text-red-600 jd-border-red-600 hover:jd-bg-red-50"
            >
              {getMessage('cancel_subscription', undefined, 'Cancel Subscription')}
            </Button>
          )}
        </>
      ) : subscription?.status === 'trialing' ? (
        // Trial period - only show cancel trial option
        <div className="jd-space-y-3">
          <div className="jd-p-4 jd-bg-blue-50 jd-border jd-border-blue-200 jd-rounded-lg">
            <p className="jd-text-blue-800 jd-text-sm jd-text-center">
              {getMessage('trial_management_info', undefined, 'You are currently in your free trial period. You can cancel anytime without being charged.')}
            </p>
          </div>
          
          <Button
            onClick={onCancel}
            disabled={loading || isLoading}
            variant="outline"
            className="jd-w-full jd-text-red-600 jd-border-red-600 hover:jd-bg-red-50 jd-flex jd-items-center jd-justify-center jd-space-x-2"
          >
            {loading ? (
              <RefreshCw className="jd-w-4 jd-h-4 jd-animate-spin" />
            ) : (
              <XCircle className="jd-w-4 jd-h-4" />
            )}
            <span>{getMessage('cancel_trial', undefined, 'Cancel Trial')}</span>
          </Button>
        </div>
      ) : subscription?.status === 'past_due' ? (
        // Past due - show update payment method
        <Button
          onClick={onManage}
          disabled={loading || isLoading}
          className="jd-w-full jd-flex jd-items-center jd-justify-center jd-space-x-2 jd-bg-orange-600 hover:jd-bg-orange-700"
        >
          {loading ? (
            <RefreshCw className="jd-w-4 jd-h-4 jd-animate-spin" />
          ) : (
            <ExternalLink className="jd-w-4 jd-h-4" />
          )}
          <span>{getMessage('update_payment_method', undefined, 'Update Payment Method')}</span>
        </Button>
      ) : (
        // No active subscription - show upgrade option
        <Button
          onClick={onUpgrade}
          className="jd-w-full jd-flex jd-items-center jd-justify-center jd-space-x-2 jd-bg-green-600 hover:jd-bg-green-700"
        >
          <Crown className="jd-w-4 jd-h-4" />
          <span>{getMessage('upgradeToPremium', undefined, 'Upgrade to Premium')}</span>
        </Button>
      )}
    </div>

    <div className="jd-flex jd-justify-center jd-pt-4">
      <Button
        onClick={onRefresh}
        disabled={loading || isLoading}
        variant="ghost"
        size="sm"
        className="jd-text-muted-foreground hover:jd-text-foreground"
      >
        <RefreshCw className={`jd-w-4 jd-h-4 jd-mr-2 ${loading || isLoading ? 'jd-animate-spin' : ''}`} />
        {getMessage('refresh', undefined, 'Refresh')}
      </Button>
    </div>
  </>
);