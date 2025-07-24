import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Crown } from 'lucide-react';
import { SubscriptionStatus } from '@/types/subscription';
import { getMessage } from '@/core/utils/i18n';
import { formatDate, getPlanDisplayName, StatusInfo } from './helpers';

interface Props {
  subscription: SubscriptionStatus;
  statusInfo: StatusInfo;
}

export const SubscriptionStatusCard: React.FC<Props> = ({ subscription, statusInfo }) => {
  console.log('subscription 👀👀👀👀--->', subscription);
  return (
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
                {getPlanDisplayName(subscription.planName)}
              </p>
              <p className="jd-text-sm jd-text-muted-foreground">{statusInfo.message}</p>
            </div>
          </div>

          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
        </div>

        {(subscription.status === 'active' || subscription.status === 'trialing') && (
          <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-4 jd-pt-4">
            {subscription.status === 'trialing' && subscription.trialEnd && (
              <div className="jd-space-y-2 md:jd-col-span-2">
                <p className="jd-text-sm jd-text-muted-foreground">
                  {getMessage('trial_ends', undefined, 'Trial ends')}
                </p>
                <p className="jd-font-medium jd-text-blue-600">{formatDate(subscription.trialEnd)}</p>
                <p className="jd-text-xs jd-text-muted-foreground">
                  {getMessage('trial_billing_info', undefined, 'Your payment method will be charged automatically when the trial ends, unless you cancel.')}
                </p>
              </div>
            )}

            {subscription.status === 'active' && subscription.currentPeriodEnd && (
              <div className="jd-space-y-2">
                <p className="jd-text-sm jd-text-muted-foreground">
                  {getMessage('next_billing_date', undefined, 'Next billing date')}
                </p>
                <p className="jd-font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
              </div>
            )}

            <div className="jd-space-y-2">
              <p className="jd-text-sm jd-text-muted-foreground">
                {getMessage('billing_status', undefined, 'Billing status')}
              </p>
              <p className="jd-font-medium">
                {subscription.cancelAtPeriodEnd
                  ? getMessage('cancelling_at_period_end', undefined, 'Cancelling at period end')
                  : subscription.status === 'active'
                  ? getMessage('active_renewing', undefined, 'Active & renewing')
                  : subscription.status === 'trialing'
                  ? getMessage('trial_period', undefined, 'Free trial period')
                  : getMessage('inactive', undefined, 'Inactive')}
              </p>
            </div>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
          <div className="jd-flex jd-items-start jd-space-x-2 jd-p-3 jd-bg-yellow-50 jd-border jd-border-yellow-200 jd-rounded-lg">
            <AlertTriangle className="jd-w-5 jd-h-5 jd-text-yellow-600 jd-mt-0.5" />
            <div>
              <p className="jd-text-yellow-800 jd-text-sm jd-font-medium">
                {subscription.status === 'trialing'
                  ? getMessage('trial_ending_title', undefined, 'Trial Ending')
                  : getMessage('subscription_cancelling_title', undefined, 'Subscription Cancelling')}
              </p>
              <p className="jd-text-yellow-700 jd-text-sm">
                {subscription.status === 'trialing'
                  ? getMessage(
                      'trial_end_no_charge',
                      undefined,
                      "Your trial will end on {0}. You won't be charged."
                    ).replace('{0}', formatDate(subscription.currentPeriodEnd))
                  : getMessage(
                      'subscription_cancelling_message',
                      undefined,
                      "Your subscription will end on {0}. You'll continue to have access until then."
                    ).replace('{0}', formatDate(subscription.currentPeriodEnd))}
              </p>
            </div>
          </div>
        )}

        {subscription.status === 'past_due' && (
          <div className="jd-flex jd-items-start jd-space-x-2 jd-p-3 jd-bg-red-50 jd-border jd-border-red-200 jd-rounded-lg">
            <AlertTriangle className="jd-w-5 jd-h-5 jd-text-red-600 jd-mt-0.5" />
            <div>
              <p className="jd-text-red-800 jd-text-sm jd-font-medium">
                {getMessage('payment_overdue_title', undefined, 'Payment Overdue')}
              </p>
              <p className="jd-text-red-700 jd-text-sm">
                {getMessage(
                  'payment_overdue_message',
                  undefined,
                  'Your payment is overdue. Please update your payment method to continue using premium features.'
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};