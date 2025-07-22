import React from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle, AlertCircle } from 'lucide-react';
import { getMessage } from '@/core/utils/i18n';

export interface StatusInfo {
  icon: React.ReactNode;
  color: string;
  label: string;
  message: string;
}

export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
};

export const getPlanDisplayName = (planName: string | null) => {
  switch (planName) {
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

export const getStatusInfo = (status: string): StatusInfo => {
  switch (status) {
    case 'active':
      return {
        icon: <CheckCircle className="jd-w-5 jd-h-5 jd-text-green-500" />,
        color: 'jd-bg-green-100 jd-text-green-800',
        label: getMessage('active', undefined, 'Active'),
        message: getMessage('active_subscription_desc', undefined, 'Your subscription is active'),
      };
    case 'trialing':
      return {
        icon: <Clock className="jd-w-5 jd-h-5 jd-text-blue-500" />,
        color: 'jd-bg-blue-100 jd-text-blue-800',
        label: getMessage('trial', undefined, 'Trial'),
        message: getMessage('trial_subscription_desc', undefined, 'You are in your trial period'),
      };
    case 'past_due':
      return {
        icon: <AlertTriangle className="jd-w-5 jd-h-5 jd-text-orange-500" />,
        color: 'jd-bg-orange-100 jd-text-orange-800',
        label: getMessage('past_due', undefined, 'Past Due'),
        message: getMessage('past_due_subscription_desc', undefined, 'Your payment is overdue'),
      };
    case 'cancelled':
      return {
        icon: <XCircle className="jd-w-5 jd-h-5 jd-text-red-500" />,
        color: 'jd-bg-red-100 jd-text-red-800',
        label: getMessage('cancelled', undefined, 'Cancelled'),
        message: getMessage('cancelled_subscription_desc', undefined, 'Your subscription has been cancelled'),
      };
    case 'incomplete':
      return {
        icon: <AlertCircle className="jd-w-5 jd-h-5 jd-text-yellow-500" />,
        color: 'jd-bg-yellow-100 jd-text-yellow-800',
        label: getMessage('incomplete', undefined, 'Incomplete'),
        message: getMessage('incomplete_subscription_desc', undefined, 'Your subscription setup is incomplete'),
      };
    default:
      return {
        icon: <XCircle className="jd-w-5 jd-h-5 jd-text-gray-500" />,
        color: 'jd-bg-gray-100 jd-text-gray-600',
        label: getMessage('inactive', undefined, 'Inactive'),
        message: getMessage('no_active_subscription', undefined, 'No active subscription'),
      };
  }
};
