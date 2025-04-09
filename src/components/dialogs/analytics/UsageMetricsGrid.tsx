// src/components/dialogs/analytics/UsageMetricsGrid.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getMessage } from '@/core/utils/i18n';

interface MetricProps {
  label: string;
  value: string | number;
  subtitle?: string;
  changeValue?: string | number;
  changeLabel?: string;
  isPositive?: boolean;
}

/**
 * A reusable component for displaying usage metrics in a grid layout
 * with labels, values, and optional change indicators
 */
const UsageMetricsGrid: React.FC<{ metrics: MetricProps[] }> = ({ metrics }) => {
  return (
    <div className="jd-grid jd-grid-cols-2 jd-sm:jd-grid-cols-3 jd-gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="jd-overflow-hidden">
          <CardContent className="jd-p-4">
            <p className="jd-text-sm jd-text-muted-foreground jd-mb-1">
              {metric.label}
            </p>
            <div className="jd-flex jd-items-baseline">
              <span className="jd-text-2xl jd-font-bold">{metric.value}</span>
              {metric.subtitle && (
                <span className="jd-ml-1 jd-text-sm jd-text-muted-foreground">
                  {metric.subtitle}
                </span>
              )}
            </div>
            
            {(metric.changeValue !== undefined || metric.changeLabel) && (
              <div className="jd-mt-2 jd-flex jd-items-center jd-text-xs">
                {metric.changeValue !== undefined && (
                  <span 
                    className={`jd-font-medium ${
                      metric.isPositive === undefined ? 'jd-text-muted-foreground' :
                      metric.isPositive ? 'jd-text-green-600 jd-dark:jd-text-green-500' : 
                      'jd-text-red-600 jd-dark:jd-text-red-500'
                    }`}
                  >
                    {metric.isPositive !== undefined && (
                      <span>{metric.isPositive ? '↑' : '↓'} </span>
                    )}
                    {metric.changeValue}
                  </span>
                )}
                {metric.changeLabel && (
                  <span className="jd-text-muted-foreground jd-ml-1">
                    {metric.changeLabel}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * Helper for creating and translating metrics
 */
export const createMetricsData = (stats: any, language: string = 'en'): MetricProps[] => {
  // Format number helper
  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  return [
    {
      label: getMessage('totalConversations', undefined, 'Total Conversations'),
      value: formatNumber(stats.totalChats),
      changeValue: stats.recentChats,
      changeLabel: getMessage('lastWeek', undefined, 'last week'),
      isPositive: stats.recentChats > 0
    },
    {
      label: getMessage('avgMessagesPerChat', undefined, 'Avg Messages Per Chat'),
      value: stats.avgMessagesPerChat.toFixed(1),
      subtitle: getMessage('messages', undefined, 'messages')
    },
    {
      label: getMessage('totalMessages', undefined, 'Total Messages'),
      value: formatNumber(stats.totalMessages),
    },
    {
      label: getMessage('responseTime', undefined, 'Response Time'),
      value: stats.thinkingTime.average.toFixed(1),
      subtitle: getMessage('seconds', undefined, 'seconds')
    },
    {
      label: getMessage('inputTokens', undefined, 'Input Tokens'),
      value: formatNumber(stats.tokenUsage.totalInput),
      changeValue: formatNumber(stats.tokenUsage.recentInput),
      changeLabel: getMessage('recent', undefined, 'recent'),
    },
    {
      label: getMessage('outputTokens', undefined, 'Output Tokens'),
      value: formatNumber(stats.tokenUsage.totalOutput),
      changeValue: formatNumber(stats.tokenUsage.recentOutput),
      changeLabel: getMessage('recent', undefined, 'recent'),
    }
  ];
};

export default UsageMetricsGrid;