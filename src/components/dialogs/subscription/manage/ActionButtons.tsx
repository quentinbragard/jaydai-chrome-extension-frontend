import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Crown } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';
import { SubscriptionStatus } from '@/types/subscription';

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
      {subscription?.status === 'active' || subscription?.status === 'trialing' ? (
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
      ) : subscription?.status === 'cancelled' && subscription.cancelAtPeriodEnd ? (
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
      ) : subscription?.status === 'past_due' ? (
        <>
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
        </>
      ) : (
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
        {getMessage('refresh_status', undefined, 'Refresh Status')}
      </Button>
    </div>
  </>
);
